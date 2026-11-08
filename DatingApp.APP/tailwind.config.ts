import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        maroon: {
          50: "#fdf2f4",
          100: "#fbe8eb",
          200: "#f7d2d9",
          300: "#f0abb8",
          400: "#e5788f",
          500: "#d44969",
          600: "#b92b4f",
          700: "#981c3c",
          800: "#801b34",
          850: "#70162c",
          900: "#5d1425",
          950: "#3d0815",
        },
        gold: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        }
      },
    },
  },
  plugins: [],
} satisfies Config;

