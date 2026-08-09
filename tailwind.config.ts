import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1E6FA8",
          "blue-dark": "#155482",
          "blue-light": "#E7F1F8",
          green: "#2E9B6E",
          "green-dark": "#227A56",
          "green-light": "#E6F5EE",
        },
        ink: {
          DEFAULT: "#1F2A33",
          soft: "#4C5A65",
          muted: "#7C8993",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F6F8F9",
          line: "#E3E9EC",
        },
        status: {
          amber: "#C7821A",
          "amber-bg": "#FBF1E1",
          red: "#C0392B",
          "red-bg": "#FBEAE8",
          green: "#227A56",
          "green-bg": "#E6F5EE",
        },
      },
      fontFamily: {
        thai: ["var(--font-noto-thai)", "sans-serif"],
        sans: ["var(--font-inter)", "var(--font-noto-thai)", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.7" }],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(31, 42, 51, 0.06), 0 1px 6px -1px rgba(31, 42, 51, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
