import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2C2C2A",
        leaf: "#085041",
        mint: "#E1F5EE",
        sand: "#F1EFE8",
        coral: {
          DEFAULT: "#D85A30",
          dark: "#B94723",
          soft: "#FAECE7"
        }
      },
      boxShadow: { soft: "0 18px 50px rgba(44, 44, 42, 0.09)" }
    }
  },
  plugins: []
} satisfies Config;
