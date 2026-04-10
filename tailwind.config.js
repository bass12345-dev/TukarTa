/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "var(--color-bg)",
          bg2: "var(--color-bg2)",
          surface: "var(--color-surface)",
          "surface-hover": "var(--color-surface-hover)",
          glass: "var(--color-glass)",
          "glass-border": "var(--color-glass-border)",
          cyan: "#00D4FF",
          "cyan-dim": "rgba(0,212,255,0.12)",
          "cyan-glow": "rgba(0,212,255,0.25)",
          purple: "#8B5CF6",
          "purple-dim": "rgba(139,92,246,0.15)",
          "purple-glow": "rgba(139,92,246,0.3)",
          pink: "#EC4899",
          gold: "#F59E0B",
          "gold-dim": "rgba(245,158,11,0.12)",
          green: "#10B981",
          "green-dim": "rgba(16,185,129,0.12)",
          text: "var(--color-text)",
          "text-sec": "var(--color-text-sec)",
          "text-dim": "var(--color-text-dim)",
        },
      },
      borderRadius: {
        'r-sm': '8px',
        'r-md': '14px',
        'r-lg': '20px',
        'r-xl': '28px',
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}

