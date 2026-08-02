'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import type { FluidSimulation } from '@/lib/fluid-simulation/FluidSimulation';
import { useSettings } from '@/components/Elements/Providers/SettingsProvider';
import { TEXT_LINE1, TEXT_LINE2 } from '@/lib/utils';

const MaskRevealHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const maskSceneRef = useRef<{
        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.OrthographicCamera;
        fluid: FluidSimulation;
        material: THREE.ShaderMaterial;
    } | null>(null);

    const { heroBackURL, heroFrontURL } = useSettings();

    // Only the ≥md layout renders this WebGL hero (mobile uses <MobileHero/>).
    // The wrapper is hidden with CSS, but the component still mounts, so gate the
    // expensive simulation behind a matching media query — otherwise phones run a
    // full-resolution fluid sim + rAF loop + global listeners for an invisible canvas.
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!isDesktop) return;
        if (!canvasRef.current || !containerRef.current) return;

        let disposed = false;
        let cleanup: (() => void) | null = null;

        // three.js + the fluid sim are heavy and desktop-only, so load them
        // lazily here. This keeps the WebGL payload off the initial homepage
        // bundle; the SSR'd markup (canvas + marquees) is unchanged, so there's
        // no new layout — the canvas simply paints once the chunk arrives, the
        // same point at which the effect already ran.
        (async () => {
        const THREE = await import('three');
        const { FluidSimulation } = await import('@/lib/fluid-simulation/FluidSimulation');
        if (disposed || !canvasRef.current || !containerRef.current) return;

        // Honor prefers-reduced-motion: render the static resting frame but skip
        // the hover-driven fluid reveal and continuous animation (see below).
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // No MSAA: the scene is one full-screen quad, so there are no
        // geometric edges to smooth — antialiasing only costs bandwidth here.
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            alpha: true,
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const fluid = new FluidSimulation(renderer, width, height);

        // While the mask is fully shrunk the canvas is just the static back
        // image — the loop draws one frame and sleeps (idleDrawn) instead of
        // running the sim + composite at 60fps for nothing. Anything that
        // changes what that static frame should show must call wake().
        let idleDrawn = false;
        const wake = () => { idleDrawn = false; };
        // A restored GL context comes back with a cleared drawing buffer; the
        // sleeping loop must repaint or the hero stays blank until pointer entry.
        canvas.addEventListener('webglcontextrestored', wake);

        const textureLoader = new THREE.TextureLoader();
        // Feed the shader the real image aspect ratio once each texture decodes
        // (the uImageResolution default below is just a first guess). Without
        // this the cover-fit math uses a wrong aspect and mis-frames the
        // subject for any portrait that isn't exactly 16:9.
        const onImageLoad = (texture: THREE.Texture) => {
            const img = texture.image as { width?: number; height?: number } | undefined;
            if (img?.width && img?.height && maskSceneRef.current) {
                maskSceneRef.current.material.uniforms.uImageResolution.value.set(img.width, img.height);
            }
            wake();
        };
        const backTexture = textureLoader.load(heroBackURL ?? '/images/p3.webp', onImageLoad);
        const frontTexture = textureLoader.load(heroFrontURL ?? '/images/p2.avif', onImageLoad);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uBackTexture: { value: backTexture },
                uFrontTexture: { value: frontTexture },
                uMaskTexture: { value: null },
                uResolution: { value: new THREE.Vector2(width, height) },
                uImageResolution: { value: new THREE.Vector2(1920, 1080) }, // Default, will update on load
                uImageScale: { value: 1.0 }, // 1.0 = full cover, no shrink
                uTime: { value: 0 },
                uProgress: { value: 0 }, // hover grow/shrink (0 hidden → 1 revealed)
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                uniform sampler2D uBackTexture;
                uniform sampler2D uFrontTexture;
                uniform sampler2D uMaskTexture;
                uniform vec2 uResolution;
                uniform vec2 uImageResolution;
                uniform float uImageScale;
                uniform float uTime;
                uniform float uProgress;

                // Framer "Hover Mask Reveal" defaults, pre-mapped from its
                // property controls:
                //   Strength 0.6  → boost 0.5 + 0.6*3.5  = 2.6
                //   Edge grain 0.7 → freq (2 + 0.7*12) / (1 - 0.7*0.7) ≈ 20.4,
                //                    strength 0.7*3 = 2.1
                //   Speed 5      → 5 * 0.1 = 0.5
                const float CIRCLE_BOOST = 2.6;
                const float NOISE_FREQ = 20.39;
                const float NOISE_STRENGTH = 2.1;
                const float TIME_SPEED = 0.5;

                // Simplex noise 3D from https://github.com/ashima/webgl-noise
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                               i.z + vec4(0.0, i1.z, i2.z, 1.0))
                             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    vec4 x = x_ * ns.x + ns.yyyy;
                    vec4 y = y_ * ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    vec4 s0 = floor(b0) * 2.0 + 1.0;
                    vec4 s1 = floor(b1) * 2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }

                vec2 getUv(vec2 uv, vec2 res, vec2 imgRes) {
                    float screenAspect = res.x / res.y;
                    float imgAspect = imgRes.x / imgRes.y;
                    vec2 newUv = uv;
                    if (screenAspect > imgAspect) {
                        float s = screenAspect / imgAspect;
                        // Cover-crop vertically. The subject's head sits near the
                        // top of the frame, so a centered crop slices the hair on
                        // wide/short viewports (e.g. laptops with display scaling).
                        // Bias the crop window toward the top as the viewport gets
                        // wider, taking the cut from the empty bottom instead.
                        // op = 0.5 leaves tall screens with the original centered crop.
                        float op = mix(0.5, 0.92, clamp((s - 1.0) / 0.45, 0.0, 1.0));
                        newUv.y = uv.y / s + op * (1.0 - 1.0 / s);
                    } else {
                        float s = imgAspect / screenAspect;
                        newUv.x = (uv.x - 0.5) / s + 0.5;
                    }
                    return newUv;
                }

                void main() {
                    float density = texture2D(uMaskTexture, vUv).r * CIRCLE_BOOST * uProgress;
                    float reveal = pow(density, 1.5);

                    // The grain noise only ever erodes the mask (both octaves
                    // are shifted negative), so pixels whose density can't
                    // clear the smoothstep floor are mask=0 no matter what the
                    // noise says - skip the two snoise calls there. That's
                    // ~95% of the screen; identical output, far cheaper frame.
                    float mask = 0.0;
                    if (reveal > 0.35) {
                        // Drifting negative noise erodes wobbly bites out of
                        // the blob's rim - the "liquid" edge of the reference.
                        float offx = vUv.x + (uTime * TIME_SPEED * 0.1) + sin(vUv.y + uTime * TIME_SPEED * 0.1);
                        float offy = vUv.y - cos(uTime * TIME_SPEED * 0.001) * 0.01;
                        float n1 = snoise(vec3(offx * NOISE_FREQ, offy * NOISE_FREQ, uTime * TIME_SPEED)) - 1.0;
                        float n2 = snoise(vec3(offx * NOISE_FREQ * 0.5, offy * NOISE_FREQ * 0.5, uTime * TIME_SPEED * 0.7)) - 1.0;
                        float n = (n1 + n2 * 0.5) * 0.7;

                        mask = smoothstep(0.35, 0.55, n * NOISE_STRENGTH + reveal);
                    }

                    vec2 uv = getUv(vUv, uResolution, uImageResolution);
                    uv = (uv - 0.5) / uImageScale + 0.5;
                    vec4 back = texture2D(uBackTexture, uv);
                    vec4 front = texture2D(uFrontTexture, uv);
                    // The textures are pre-cut PNGs with a real alpha channel
                    // (background removed via rembg), so transparency comes
                    // straight from alpha - no brightness keying. mix() blends
                    // rgb AND alpha, so the white shirt / bright suit stay solid
                    // while the removed background reveals the marquee behind.
                    vec4 finalImage = mix(back, front, mask);

                    gl_FragColor = vec4(finalImage.rgb, finalImage.a);
                }
            `,
            transparent: true,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);

        maskSceneRef.current = { renderer, scene, camera, fluid, material };

        // ── Pointer → fluid coupling (Framer "Hover Mask Reveal" scheme) ──
        // The sim re-stamps a big gaussian at the RAW cursor position every
        // frame, so the blob stays glued to the pointer — no smoothing, no
        // trail of thrown ink. `progress` grows the mask in on hover and
        // shrinks it out on leave; the sim is wiped on (re)entry so the blob
        // always grows fresh under the cursor instead of streaking from its
        // last position.
        const mouse = new THREE.Vector2(0.5, 0.5);
        const prevMouse = new THREE.Vector2(0.5, 0.5);
        const delta = new THREE.Vector2();
        let pointerActive = false;
        let activePointerId = -1;
        let progress = 0;
        let progressTarget = 0;
        let visible = true; // hero in viewport? (kept in sync by the observer below)

        const onPointerMove = (e: PointerEvent) => {
            if (!visible || !e.isPrimary) return;
            const rect = container.getBoundingClientRect();
            // The window-level listener stands in for the reference's
            // container mouseenter/mouseleave: moving off the hero (e.g. onto
            // sections below a partially scrolled hero) shrinks the blob out
            // instead of pinning it to the hero's edge.
            const inside =
                e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom;
            if (!inside) {
                pointerActive = false;
                progressTarget = 0;
                return;
            }
            const x = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
            const y = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
            if (!pointerActive) {
                fluid.clear();
                prevMouse.set(x, y);
                pointerActive = true;
            }
            activePointerId = e.pointerId;
            mouse.set(x, y);
            progressTarget = 1;
        };

        // Shrink out when the cursor leaves the page. Touch pointers dispatch
        // pointerleave right after pointerup/pointercancel, so this also
        // resets between strokes — the next tap grows fresh instead of
        // streaking from the previous finger-lift point. The pointerId guard
        // keeps an incidental tap on a hybrid device from killing an active
        // mouse hover.
        const onPointerLeave = (e: PointerEvent) => {
            if (e.pointerId !== activePointerId) return;
            pointerActive = false;
            progressTarget = 0;
        };

        // Reduced-motion users get the static resting frame (the back image),
        // but no pointer coupling — so the liquid reveal never animates.
        if (!reduceMotion) {
            window.addEventListener('pointermove', onPointerMove);
            document.documentElement.addEventListener('pointerleave', onPointerLeave);
        }

        // Pause the (expensive) fluid simulation whenever the hero is scrolled
        // out of view — this is the main fix for laggy scrolling. Read the
        // LAST entry: batched IO entries are oldest-first, and acting on a
        // stale one can freeze `visible` at the wrong value.
        const io = new IntersectionObserver(
            (entries) => {
                visible = entries[entries.length - 1].isIntersecting;
                if (!visible) {
                    pointerActive = false;
                    progressTarget = 0;
                    // Snap while off-screen so no ghost blob fades back in at
                    // a stale cursor position when the hero scrolls into view.
                    progress = 0;
                }
            },
            { threshold: 0 },
        );
        io.observe(container);

        let animationFrameId: number;
        let lastTime = performance.now();

        const render = (time: number) => {
            animationFrameId = requestAnimationFrame(render);

            // Skip all GPU work while off-screen or the tab is hidden; keep the
            // loop alive so it resumes instantly when the hero returns.
            if (!visible || document.hidden) {
                lastTime = time;
                return;
            }

            const dt = Math.min((time - lastTime) / 1000, 0.032);
            lastTime = time;

            const isIdle = progressTarget === 0 && progress < 0.001;
            if (isIdle && idleDrawn) return;

            // Hover grow/shrink — the reference lerps 8% per frame at 60fps;
            // rescale by real dt so it matches on any refresh rate.
            progress += (progressTarget - progress) * (1 - Math.pow(0.92, dt * 60));

            delta.subVectors(mouse, prevMouse);
            prevMouse.copy(mouse);
            fluid.update(dt, mouse, delta);

            material.uniforms.uMaskTexture.value = fluid.getDensityTexture();
            material.uniforms.uTime.value = time * 0.001;
            material.uniforms.uProgress.value = progress;

            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
            idleDrawn = isIdle;
        };

        animationFrameId = requestAnimationFrame(render);

        const onResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            renderer.setSize(newWidth, newHeight);
            material.uniforms.uResolution.value.set(newWidth, newHeight);
            fluid.resize(newWidth, newHeight);
            wake(); // setSize cleared the canvas — redraw even if idle
        };

        window.addEventListener('resize', onResize);

        cleanup = () => {
            window.removeEventListener('pointermove', onPointerMove);
            document.documentElement.removeEventListener('pointerleave', onPointerLeave);
            window.removeEventListener('resize', onResize);
            canvas.removeEventListener('webglcontextrestored', wake);
            io.disconnect();
            cancelAnimationFrame(animationFrameId);
            fluid.dispose();
            mesh.geometry.dispose();
            material.dispose();
            backTexture.dispose();
            frontTexture.dispose();
            renderer.dispose();
        };
        })();

        return () => {
            disposed = true;
            cleanup?.();
        };
    }, [isDesktop, heroBackURL, heroFrontURL]);


    return (
        <div
            ref={containerRef}
            className="hero-container"
        >
            {/* ── Layer 0: subtle line pattern, far back ── */}
            <svg
                className="wave-bg"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <pattern
                        id="waves"
                        x="0"
                        y="0"
                        width="40"
                        height="60"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M20 0 C26 10, 34 10, 40 20 C46 30, 34 30, 40 40 C46 50, 34 50, 40 60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.6"
                        />
                        <path
                            d="M0 0 C6 10, 14 10, 20 20 C26 30, 14 30, 20 40 C26 50, 14 50, 20 60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.6"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#waves)" />
            </svg>

            {/* ── Layer 0.5: stage spotlight — soft warm glow centered on subject ── */}
            <div className="stage-spotlight" aria-hidden />

            {/* Layer 1 – Back marquee (sits behind everything) */}
            <div className="marquee-layer back">
                <div className="marquee-row line-1">
                    <MarqueeTrack text={TEXT_LINE1} reverse />
                </div>
                <div className="marquee-row line-2" style={{ marginTop: "0.15em" }}>
                    <MarqueeTrack text={TEXT_LINE2} />
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className="mask-canvas"
            />

            {/* Layer 4 – Front marquee (clips above person's waist) */}
            <div className="marquee-layer front">
                <div className="marquee-row line-1">
                    <MarqueeTrack text={TEXT_LINE1} reverse />
                </div>
                <div className="marquee-row line-2" style={{ marginTop: "0.15em" }}>
                    <MarqueeTrack text={TEXT_LINE2} />
                </div>
            </div>

            {/* ── Layer 11: edge vignette + film grain — finishes the photograph ── */}
            <div className="vignette" aria-hidden />
            <div className="grain" aria-hidden />

            {/* ── Layer 13: top-fade scrim — gives the navbar a clean band to float over ── */}
            <div className="top-fade" aria-hidden />
        </div>
    );
};

const MarqueeTrack = ({ text, reverse = false }: { text: string, reverse?: boolean }) => {
    // 2 copies is the minimum for a seamless -50% translate loop. More copies
    // multiply the composited layer width (8 copies of 220px text ≈ a
    // 40,000px-wide GPU layer per track, ×4 tracks) and jank the compositor;
    // the loop speed is kept by per-row durations in globals.css.
    const words = Array(2).fill(text);
    return (
        <div className={`marquee-track ${reverse ? 'reverse' : ''}`}>
            {words.map((w, i) => (
                <span key={i} className="marquee-word">
                    {w}
                </span>
            ))}
        </div>
    );
};

export default MaskRevealHero;
