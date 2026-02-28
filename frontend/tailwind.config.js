/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      backgroundImage: {
        "mesh-slate-violet":
          "radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.15), transparent 35%), radial-gradient(circle at 85% 85%, rgba(79, 70, 229, 0.12), transparent 30%)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float-delayed 8s ease-in-out 1s infinite",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
