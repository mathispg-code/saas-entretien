/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f7",
          100: "#d7e0eb",
          200: "#aec0d6",
          300: "#84a0c2",
          400: "#4d6d94",
          500: "#2c4a6e",
          600: "#1e3a5f",
          700: "#182f4d",
          800: "#13253c",
          900: "#0d1a2a",
          950: "#080f1a",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.8" },
          "50%": { transform: "translate(24px, -18px) scale(1.06)", opacity: "1" },
        },
        floatSlow2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.7" },
          "50%": { transform: "translate(-20px, 16px) scale(1.05)", opacity: "0.95" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.35s ease-out",
        "float-slow-1": "floatSlow1 10s ease-in-out infinite",
        "float-slow-2": "floatSlow2 13s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
