import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Every value is a CSS variable (defined per-theme in globals.css)
        // instead of a literal hex — so every existing usage of e.g.
        // `text-ink` or `bg-surface-soft` across the app automatically
        // follows the active theme with zero changes to component code.
        brand: {
          blue: "rgb(var(--color-brand-blue) / <alpha-value>)",
          "blue-dark": "rgb(var(--color-brand-blue-dark) / <alpha-value>)",
          "blue-light": "rgb(var(--color-brand-blue-light) / <alpha-value>)",
          green: "rgb(var(--color-brand-green) / <alpha-value>)",
          "green-dark": "rgb(var(--color-brand-green-dark) / <alpha-value>)",
          "green-light": "rgb(var(--color-brand-green-light) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          soft: "rgb(var(--color-surface-soft) / <alpha-value>)",
          line: "rgb(var(--color-surface-line) / <alpha-value>)",
        },
        status: {
          amber: "rgb(var(--color-status-amber) / <alpha-value>)",
          "amber-bg": "rgb(var(--color-status-amber-bg) / <alpha-value>)",
          red: "rgb(var(--color-status-red) / <alpha-value>)",
          "red-bg": "rgb(var(--color-status-red-bg) / <alpha-value>)",
          green: "rgb(var(--color-status-green) / <alpha-value>)",
          "green-bg": "rgb(var(--color-status-green-bg) / <alpha-value>)",
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
