import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Legacy aliases kept for backward compat
        ink: "#2C2C2A",
        leaf: "#085041",
        mint: "#E1F5EE",
        sand: "#F1EFE8",
        coral: {
          DEFAULT: "#D85A30",
          dark: "#B94723",
          soft: "#FAECE7",
          200: "#F5C4B3",
          400: "#F0997B",
          600: "#D85A30",
          900: "#4A1B0C",
          50: "#FAECE7",
        },
        // Modern Nusantara teal scale (DESIGN.md §2.1)
        teal: {
          50:  "#E1F5EE",
          200: "#9FE1CB",
          300: "#5DCAA5",
          500: "#1D9E75",
          700: "#0F6E56",
          900: "#085041",
        },
        // Warm neutrals (DESIGN.md §2.3)
        nusa: {
          50:  "#F1EFE8",
          100: "#D3D1C7",
          200: "#B4B2A9",
          400: "#888780",
          600: "#5F5E5A",
          900: "#2C2C2A",
        },
        // BNB Chain identity yellow
        bnb: {
          DEFAULT: "#F0B90B",
          dark:    "#D4A109",
          light:   "#FFF3CD",
          50:      "#FFFBEB",
        },
        // Functional
        danger: "#E24B4A",
        warn:   "#EF9F27",
      },
      boxShadow: {
        soft:   "0 1px 3px rgba(44, 44, 42, 0.06)",
        "soft-md": "0 2px 8px rgba(44, 44, 42, 0.08)",
        "soft-lg": "0 4px 16px rgba(44, 44, 42, 0.10)",
      },
      backgroundImage: {
        "teal-gradient": "linear-gradient(135deg, #085041 0%, #0F6E56 60%, #1D9E75 100%)",
        "bnb-gradient":  "linear-gradient(135deg, #F0B90B 0%, #D4A109 100%)",
        "nusa-gradient": "linear-gradient(160deg, #F1EFE8 0%, #E1F5EE 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    }
  },
  plugins: []
} satisfies Config;
