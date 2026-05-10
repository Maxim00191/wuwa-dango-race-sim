/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        dangoHop: {
          "0%, 100%": { transform: "translateY(0) scale(1, 1)" },
          "35%": { transform: "translateY(-7px) scale(1.08, 0.88)" },
          "60%": { transform: "translateY(-2px) scale(0.94, 1.06)" },
        },
      },
      animation: {
        "dango-hop": "dangoHop 0.32s ease-out both",
      },
    },
  },
  plugins: [],
};
