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
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
