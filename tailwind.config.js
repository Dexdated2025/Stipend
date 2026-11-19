/** @type {import('tailwindcss').Config} */
// Stipend brand tokens. Three colours, three jobs:
//   charcoal  = the SOFT one, the canvas (bg, surface, raised, line)
//   tangerine = the BOLD one, used sparingly for action and attention
//   electric  = the HALO, light not paint: glows, gradients, focus rings, chart fills
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charcoal layers, soft and matte
        bg: "#141518",
        deep: "#111215",
        surface: "#16171B",
        raised: "#1C1D22",
        lift: "#23242A",
        line: "#2A2C33",
        fg: "#ECEDF1",
        muted: "#8B8F99",
        // Royal electric blue: the halo
        electric: {
          DEFAULT: "#2B5BFF",
          300: "#9DB3FF",
          400: "#6B8CFF",
          600: "#1F47D9",
          900: "#0E1C4D",
        },
        // Tangerine: the bold accent
        tangerine: {
          DEFAULT: "#FF8A1F",
          300: "#FFB977",
          400: "#FFA552",
          600: "#E5730A",
          900: "#4A2606",
        },
        // Status colours, desaturated so they never compete with the palette
        success: "#5FB894",
        danger: "#E2705F",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(43,91,255,0.35), 0 10px 50px -12px rgba(43,91,255,0.55)",
        "halo-sm": "0 0 0 1px rgba(43,91,255,0.28), 0 6px 24px -10px rgba(43,91,255,0.5)",
        tangerine: "0 10px 40px -10px rgba(255,138,31,0.55)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,138,31,0.45)" },
          "100%": { boxShadow: "0 0 0 16px rgba(255,138,31,0)" },
        },
        "pulse-blue": {
          "0%": { boxShadow: "0 0 0 0 rgba(43,91,255,0.55)" },
          "100%": { boxShadow: "0 0 0 14px rgba(43,91,255,0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(3%, -4%, 0) scale(1.06)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "pulse-blue": "pulse-blue 1.4s ease-out infinite",
        drift: "drift 18s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
