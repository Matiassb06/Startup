/** @type {import('tailwindcss').Config} */
export default {
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
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        float: "float 4s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3.2s ease-in-out infinite",
      },
      backgroundImage: {
        "mesh-slate-violet":
          "radial-gradient(circle at 15% 10%, rgba(99,102,241,0.2), transparent 38%), radial-gradient(circle at 85% 0%, rgba(139,92,246,0.16), transparent 34%), radial-gradient(circle at 55% 70%, rgba(56,189,248,0.08), transparent 30%)",
      },
    },
  },
  plugins: [],
};
