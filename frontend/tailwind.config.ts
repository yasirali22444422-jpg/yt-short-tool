import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          700: "#262730",
          800: "#1a1b22",
          850: "#14151b",
          900: "#0e0f14",
          950: "#08080a",
        },
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          400: "#ff7722",
          500: "#ff5500",
          600: "#e64a00",
          700: "#cc3f00",
          800: "#992f00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
