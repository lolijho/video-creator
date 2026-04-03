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
          primary: "#1a1c18",
          secondary: "#252720",
          card: "#2e302a",
          elevated: "#3b3c36",
        },
        accent: {
          DEFAULT: "#E75B12",
          glow: "#F47A3E",
          cyan: "#21888F",
          green: "#2BA68F",
        },
        txt: {
          primary: "#E6D2B5",
          secondary: "#B4B8B0",
          muted: "#7A7D76",
        },
        border: {
          DEFAULT: "rgba(230,210,181,0.10)",
          hover: "rgba(230,210,181,0.20)",
        },
        glass: "rgba(230,210,181,0.04)",
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
          "0%": { boxShadow: "0 0 5px rgba(231, 91, 18, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(231, 91, 18, 0.4)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
