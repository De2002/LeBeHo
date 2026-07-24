import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        cat: {
          tech: "hsl(214 90% 52%)",
          science: "hsl(142 60% 40%)",
          business: "hsl(28 90% 52%)",
          culture: "hsl(270 60% 52%)",
          politics: "hsl(0 72% 50%)",
          gaming: "hsl(48 95% 50%)",
          writing: "hsl(195 80% 42%)",
          ai: "hsl(248 80% 60%)",
          health: "hsl(160 55% 42%)",
          society: "hsl(330 55% 50%)",
        },
      },
      borderWidth: {
        DEFAULT: "1px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
