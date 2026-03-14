import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // BillClarity brand palette
        brand: {
          50: "#f0f7ff",
          100: "#e0eefe",
          200: "#b9ddfe",
          300: "#7cc3fd",
          400: "#36a5fa",
          500: "#0c89eb",
          600: "#006cc9",
          700: "#0156a3",
          800: "#064a86",
          900: "#0b3f6f",
        },
        risk: {
          normal: "#22c55e",
          elevated: "#f59e0b",
          extreme: "#ef4444",
        },
        severity: {
          info: "#3b82f6",
          warning: "#f59e0b",
          critical: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
