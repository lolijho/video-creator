import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#080810",
          secondary: "#10101c",
          card: "#18182a",
          elevated: "#202035",
        },
        accent: {
          DEFAULT: "#7c6dfa",
          glow: "#9d91fc",
          cyan: "#00d4ff",
          green: "#00e5a0",
        },
        txt: {
          primary: "#f0f0f8",
          secondary: "#8888a8",
          muted: "#505070",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          hover: "rgba(255,255,255,0.14)",
        },
        glass: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(124, 109, 250, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(124, 109, 250, 0.4)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
