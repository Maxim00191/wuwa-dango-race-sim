/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        dangoHop: {
          "0%, 100%": { transform: "translateY(0) scale(1, 1)" },
          "35%": { transform: "translateY(-7px) scale(1.08, 0.88)" },
          "60%": { transform: "translateY(-2px) scale(0.94, 1.06)" },
        },
        bannerPop: {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "dango-hop": "dangoHop 0.32s ease-out both",
        "banner-pop": "bannerPop 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
      },
    },
  },
  plugins: [],
};
