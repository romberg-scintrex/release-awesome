import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          800: "#111111",
          700: "#1a1a1a",
          600: "#262626",
          500: "#3f3f3f",
          400: "#737373",
          300: "#a3a3a3",
          200: "#d4d4d4",
          100: "#f5f5f5",
          50: "#fafafa",
        },
        accent: {
          DEFAULT: "#a78bfa",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        brand: {
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
          rose: "#fb7185",
          amber: "#fbbf24",
          cyan: "#22d3ee",
          emerald: "#34d399",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Outfit", "Inter", "sans-serif"],
      },
      fontSize: {
        "fluid-hero": "clamp(2.5rem, 10vw, 8rem)",
        "fluid-h1": "clamp(2rem, 6vw, 5rem)",
        "fluid-h2": "clamp(1.75rem, 4vw, 3.5rem)",
        "fluid-h3": "clamp(1.25rem, 2.5vw, 2rem)",
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at center, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "mesh-violet": "radial-gradient(at 20% 20%, rgba(139,92,246,0.25) 0px, transparent 50%), radial-gradient(at 80% 30%, rgba(217,70,239,0.20) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(34,211,238,0.20) 0px, transparent 50%)",
        "shine": "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "blob": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.95)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "shine": "shine 3s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "blob": "blob 14s ease-in-out infinite",
        "marquee": "marquee 30s linear infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [animate, forms, typography],
};

export default config;
