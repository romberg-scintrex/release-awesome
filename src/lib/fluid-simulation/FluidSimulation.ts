import * as THREE from 'three';

// Faithful port of the fluid pipeline inside the Framer University
// "Hover Mask Reveal" component (https://hov-mask.learnframer.site/).
// What makes it feel glued to the cursor, unlike a classic ink sim:
//  • one BIG gaussian splat is re-stamped at the RAW cursor every frame —
//    the blob is anchored to the pointer and survives standing still
//  • advection moves dye in *texel* units (vel * texelSize), so the fluid
//    churns its edge organically but can't carry the dye away (no scatter)
//  • density decays to 1% over SHRINK_TIME_SECONDS, so trails fade fast
// Constants mirror the component's defaults (its property-control values
// are noted where the mapping isn't 1:1).
const SIM_SCALE = 0.5; // sim runs at half the canvas CSS resolution
const MAX_SIM_DIM = 1024; // safety cap for very wide heroes
const SPLAT_RADIUS = 0.08; // "Size" — gaussian uses exp(-d²/r²)
const SPLAT_FORCE = 30; // per-frame mouse delta → velocity injection
const VELOCITY_DISSIPATION = 0.99; // per frame @60fps (rescaled by real dt)
const SHRINK_TIME_SECONDS = 2.4; // "Return time" — density → 1% over this
const DENSITY_DISSIPATION = Math.pow(0.01, 1 / (60 * SHRINK_TIME_SECONDS));
const CURL = 30; // "Swirl"
// Reference default is 25 (its control allows 10–50), but for an anchored
// blob the solve converges visually long before that — 16 saves ~36% of the
// sim's bandwidth (its dominant cost) with no perceptible difference.
const PRESSURE_ITERATIONS = 16;

const baseVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

// Aspect correction keeps the gaussian circular in pixel space:
// wide containers compress x, tall ones compress y.
const splatVelocityShader = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uPoint;
    uniform vec2 uColor;
    uniform float uRadius;
    uniform float uAspectRatio;
    uniform sampler2D uTarget;
    void main() {
        vec2 p = vUv - uPoint;
        p.x *= max(uAspectRatio, 1.0);
        p.y *= max(1.0 / uAspectRatio, 1.0);
        float splat = exp(-dot(p, p) / (uRadius * uRadius));
        vec4 base = texture2D(uTarget, vUv);
        base.xy += splat * uColor;
        gl_FragColor = base;
    }
`;

const splatDensityShader = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uPoint;
    uniform float uRadius;
    uniform float uAspectRatio;
    uniform sampler2D uTarget;
    void main() {
        vec2 p = vUv - uPoint;
        p.x *= max(uAspectRatio, 1.0);
        p.y *= max(1.0 / uAspectRatio, 1.0);
        float splat = exp(-dot(p, p) / (uRadius * uRadius));
        float base = texture2D(uTarget, vUv).r;
        gl_FragColor = vec4(base + splat, 0.0, 0.0, 1.0);
    }
`;

// Texel-unit advection — the defining trait of this look. Velocity of
// magnitude v moves dye only v texels per frame.
const advectionShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 uTexelSize;
    uniform float uDt;
    uniform float uDissipation;
    void main() {
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vec2 pos = vUv - vel * uTexelSize * uDt;
        gl_FragColor = texture2D(uSource, pos) * uDissipation;
    }
`;

const divergenceShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    void main() {
        float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
        float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
        float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
        float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
        float div = 0.5 * ((R - L) + (T - B));
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`;

const pressureShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 uTexelSize;
    void main() {
        float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).r;
        float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).r;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).r;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).r;
        float C = texture2D(uDivergence, vUv).r;
        float p = (L + R + T + B - C) * 0.25;
        gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
    }
`;

const gradientSubtractShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uPressure;
    uniform vec2 uTexelSize;
    void main() {
        float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).r;
        float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).r;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).r;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).r;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vel.x -= 0.5 * (R - L);
        vel.y -= 0.5 * (T - B);
        gl_FragColor = vec4(vel, 0.0, 1.0);
    }
`;

// The reference component's "swirl": a cheap fixed-coefficient rotational
// nudge from the local velocity gradient (not normalized vorticity
// confinement) — it livens the blob edge without adding transport.
const curlForceShader = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;
    uniform float uCurl;
    void main() {
        float vL = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
        float vR = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
        float vT = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
        float vB = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        float strength = uCurl * 0.00015;
        vel.x += strength * (vT - vB);
        vel.y += strength * (vL - vR);
        gl_FragColor = vec4(vel, 0.0, 1.0);
    }
`;

export class FluidSimulation {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;

    private velocity!: DoubleBuffer;
    private density!: DoubleBuffer;
    private pressure!: DoubleBuffer;
    private divergence!: THREE.WebGLRenderTarget;

    private mesh: THREE.Mesh;
    private materials: Record<string, THREE.ShaderMaterial> = {};

    private simWidth = 0;
    private simHeight = 0;
    private texelSize = new THREE.Vector2();
    private aspect = 1;

    constructor(renderer: THREE.WebGLRenderer, width: number, height: number) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        this.initMaterials();
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.materials.advection);
        this.scene.add(this.mesh);

        this.resize(width, height);
    }

    // Half floats match the reference and keep linear filtering core WebGL2
    // (full floats would need OES_texture_float_linear and double bandwidth).
    private targetParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
    };

    public resize(width: number, height: number) {
        let w = Math.max(1, Math.floor(width * SIM_SCALE));
        let h = Math.max(1, Math.floor(height * SIM_SCALE));
        const longest = Math.max(w, h);
        if (longest > MAX_SIM_DIM) {
            const s = MAX_SIM_DIM / longest;
            w = Math.max(1, Math.round(w * s));
            h = Math.max(1, Math.round(h * s));
        }
        this.aspect = width / Math.max(height, 1);
        if (w === this.simWidth && h === this.simHeight) return;

        this.disposeTargets();
        this.simWidth = w;
        this.simHeight = h;
        this.texelSize.set(1 / w, 1 / h);
        this.velocity = new DoubleBuffer(w, h, this.targetParams);
        this.density = new DoubleBuffer(w, h, this.targetParams);
        this.pressure = new DoubleBuffer(w, h, this.targetParams);
        this.divergence = new THREE.WebGLRenderTarget(w, h, this.targetParams);
    }

    private initMaterials() {
        const make = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
            new THREE.ShaderMaterial({
                vertexShader: baseVertexShader,
                fragmentShader,
                uniforms,
                depthTest: false,
                depthWrite: false,
            });

        this.materials.splatVelocity = make(splatVelocityShader, {
            uPoint: { value: new THREE.Vector2() },
            uColor: { value: new THREE.Vector2() },
            uRadius: { value: SPLAT_RADIUS },
            uAspectRatio: { value: 1 },
            uTarget: { value: null },
        });
        this.materials.splatDensity = make(splatDensityShader, {
            uPoint: { value: new THREE.Vector2() },
            uRadius: { value: SPLAT_RADIUS },
            uAspectRatio: { value: 1 },
            uTarget: { value: null },
        });
        this.materials.advection = make(advectionShader, {
            uVelocity: { value: null },
            uSource: { value: null },
            uTexelSize: { value: new THREE.Vector2() },
            uDt: { value: 1 },
            uDissipation: { value: 1 },
        });
        this.materials.divergence = make(divergenceShader, {
            uVelocity: { value: null },
            uTexelSize: { value: new THREE.Vector2() },
        });
        this.materials.pressure = make(pressureShader, {
            uPressure: { value: null },
            uDivergence: { value: null },
            uTexelSize: { value: new THREE.Vector2() },
        });
        this.materials.gradientSubtract = make(gradientSubtractShader, {
            uVelocity: { value: null },
            uPressure: { value: null },
            uTexelSize: { value: new THREE.Vector2() },
        });
        this.materials.curlForce = make(curlForceShader, {
            uVelocity: { value: null },
            uTexelSize: { value: new THREE.Vector2() },
            uCurl: { value: CURL },
        });
    }

    private blit(material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget) {
        this.mesh.material = material;
        this.renderer.setRenderTarget(target);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Advance one frame. `point` is the raw cursor in container uv (0..1),
     * `delta` is its per-frame movement — both stamped fresh every frame so
     * the blob stays anchored to the cursor.
     */
    public update(dt: number, point: THREE.Vector2, delta: THREE.Vector2) {
        // Normalize to 60fps "frames" so fade speed matches on any refresh
        // rate (the reference component is hardwired to per-frame factors).
        const frames = Math.min(dt * 60, 2);
        const m = this.materials;

        // 1. Stamp velocity at the cursor
        m.splatVelocity.uniforms.uPoint.value.copy(point);
        m.splatVelocity.uniforms.uColor.value.set(delta.x * SPLAT_FORCE, delta.y * SPLAT_FORCE);
        m.splatVelocity.uniforms.uAspectRatio.value = this.aspect;
        m.splatVelocity.uniforms.uTarget.value = this.velocity.read.texture;
        this.blit(m.splatVelocity, this.velocity.write);
        this.velocity.swap();

        // 2. Stamp full density at the cursor — the anchored circle
        m.splatDensity.uniforms.uPoint.value.copy(point);
        m.splatDensity.uniforms.uAspectRatio.value = this.aspect;
        m.splatDensity.uniforms.uTarget.value = this.density.read.texture;
        this.blit(m.splatDensity, this.density.write);
        this.density.swap();

        // 3. Self-advect velocity
        m.advection.uniforms.uTexelSize.value.copy(this.texelSize);
        m.advection.uniforms.uVelocity.value = this.velocity.read.texture;
        m.advection.uniforms.uSource.value = this.velocity.read.texture;
        m.advection.uniforms.uDt.value = frames;
        m.advection.uniforms.uDissipation.value = Math.pow(VELOCITY_DISSIPATION, frames);
        this.blit(m.advection, this.velocity.write);
        this.velocity.swap();

        // 4. Swirl
        m.curlForce.uniforms.uTexelSize.value.copy(this.texelSize);
        m.curlForce.uniforms.uVelocity.value = this.velocity.read.texture;
        this.blit(m.curlForce, this.velocity.write);
        this.velocity.swap();

        // 5. Divergence
        m.divergence.uniforms.uTexelSize.value.copy(this.texelSize);
        m.divergence.uniforms.uVelocity.value = this.velocity.read.texture;
        this.blit(m.divergence, this.divergence);

        // 6. Pressure solve (warm start from last frame's pressure)
        m.pressure.uniforms.uTexelSize.value.copy(this.texelSize);
        m.pressure.uniforms.uDivergence.value = this.divergence.texture;
        for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
            m.pressure.uniforms.uPressure.value = this.pressure.read.texture;
            this.blit(m.pressure, this.pressure.write);
            this.pressure.swap();
        }

        // 7. Make velocity divergence-free
        m.gradientSubtract.uniforms.uTexelSize.value.copy(this.texelSize);
        m.gradientSubtract.uniforms.uVelocity.value = this.velocity.read.texture;
        m.gradientSubtract.uniforms.uPressure.value = this.pressure.read.texture;
        this.blit(m.gradientSubtract, this.velocity.write);
        this.velocity.swap();

        // 8. Advect density with the projected velocity
        m.advection.uniforms.uVelocity.value = this.velocity.read.texture;
        m.advection.uniforms.uSource.value = this.density.read.texture;
        m.advection.uniforms.uDt.value = frames;
        m.advection.uniforms.uDissipation.value = Math.pow(DENSITY_DISSIPATION, frames);
        this.blit(m.advection, this.density.write);
        this.density.swap();

        this.renderer.setRenderTarget(null);
    }

    /** Wipe all dye/velocity — used when the cursor (re)enters the hero. */
    public clear() {
        const targets = [
            this.velocity.read, this.velocity.write,
            this.density.read, this.density.write,
            this.pressure.read, this.pressure.write,
            this.divergence,
        ];
        for (const t of targets) {
            this.renderer.setRenderTarget(t);
            this.renderer.clear(true, false, false);
        }
        this.renderer.setRenderTarget(null);
    }

    public getDensityTexture() {
        return this.density.read.texture;
    }

    private disposeTargets() {
        this.velocity?.dispose();
        this.density?.dispose();
        this.pressure?.dispose();
        this.divergence?.dispose();
    }

    public dispose() {
        this.disposeTargets();
        for (const material of Object.values(this.materials)) {
            material.dispose();
        }
        this.mesh.geometry.dispose();
    }
}

class DoubleBuffer {
    public read: THREE.WebGLRenderTarget;
    public write: THREE.WebGLRenderTarget;

    constructor(w: number, h: number, params: THREE.RenderTargetOptions) {
        this.read = new THREE.WebGLRenderTarget(w, h, params);
        this.write = new THREE.WebGLRenderTarget(w, h, params);
    }

    public swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
    }

    public dispose() {
        this.read.dispose();
        this.write.dispose();
    }
}
