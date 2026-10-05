import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#052057",
        navy: "#052057",
        secondary: "#0f618a",
        ocean: "#0f618a",
        accent: "#2bcdee",
        cyan: "#2bcdee",
        gold: "#f6b828",
        "gold-deep": "#f2870d",
        goldDeep: "#f2870d",
        background: "#f5f7fa",
        foreground: "#0a1429",
        // Extended accents — used to differentiate sections and cards so the
        // palette reads richer than navy-plus-cyan alone.
        plum: "#6d4aff",
        plumDeep: "#4c2fd6",
        rose: "#f43f6e",
        roseDeep: "#d81f52",
        teal: "#0eb8a6",
        tealDeep: "#079385",
        surface: "#ffffff",
        surfaceAlt: "#eef2f9",
        surfaceSunken: "#e6ecf5",
        hairline: "#dde5f0",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(5, 32, 87, 0.08), 0 4px 16px -4px rgba(5, 32, 87, 0.06)",
        lift: "0 8px 24px -6px rgba(5, 32, 87, 0.14), 0 2px 8px -2px rgba(5, 32, 87, 0.08)",
        glow: "0 0 0 1px rgba(43, 205, 238, 0.2), 0 8px 32px -8px rgba(15, 97, 138, 0.35)",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
