import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        phosphor: {
          DEFAULT: "var(--crt-phosphor)",
          bright: "var(--crt-phosphor-bright)",
        },
        crt: {
          muted: "var(--crt-muted)",
          panel: "var(--crt-panel)",
          border: "var(--crt-panel-border)",
        },
      },
      boxShadow: {
        glow: "0 0 24px var(--crt-glow-soft)",
        "glow-strong": "0 0 36px var(--crt-glow)",
      },
    },
  },
  plugins: [],
};
export default config;
