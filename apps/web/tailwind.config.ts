import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#13231d",
        leaf: "#176b4d",
        mint: "#dff4e9",
        sand: "#f7f4ec",
        coral: "#ef795f"
      },
      boxShadow: { soft: "0 18px 50px rgba(19, 35, 29, 0.09)" }
    }
  },
  plugins: []
} satisfies Config;
