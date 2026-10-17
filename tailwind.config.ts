import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E6B5C",
        "primary-dark": "#165A4A",
        secondary: "#D4AF37",
        "secondary-hover": "#C59E2B",
        oud: "#553E23",
        "oud-light": "#7A5B37",
        cream: "#FFF8EC",
        cardBg: "#FFFFFF",
        borderCream: "#E8DCC8",
        borderDark: "#D1C8BA",
      },
      fontFamily: {
        serif: ["Amiri", "serif"],
        luxury: ["Cinzel", "serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
