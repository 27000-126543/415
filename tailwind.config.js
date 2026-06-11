/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        "deep-space": {
          50: "#E8EDF5",
          100: "#C5D0E3",
          200: "#9CB2D0",
          300: "#7294BE",
          400: "#4F79AE",
          500: "#2E5E9E",
          600: "#1F4A85",
          700: "#143668",
          800: "#0A1628",
          900: "#060E1A",
          950: "#03070F",
        },
        lava: {
          50: "#FFF1EB",
          100: "#FFD9C7",
          200: "#FFBD99",
          300: "#FFA16B",
          400: "#FF864D",
          500: "#FF6B35",
          600: "#E5501A",
          700: "#B83D12",
          800: "#8A2D0C",
          900: "#5C1E07",
        },
        data: {
          50: "#E6FBF5",
          100: "#B3F2E1",
          200: "#80E9CE",
          300: "#4DDFBA",
          400: "#26D6A9",
          500: "#00D4AA",
          600: "#00B08C",
          700: "#008C6E",
          800: "#006850",
          900: "#004433",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F4C430",
          600: "#D9A90F",
          700: "#A8820B",
          800: "#7A5E08",
          900: "#4D3A05",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#E63946",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        data: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px currentColor, 0 0 10px currentColor" },
          "100%": { boxShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glow-orange": "0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 107, 53, 0.3)",
        "glow-cyan": "0 0 20px rgba(0, 212, 170, 0.5), 0 0 40px rgba(0, 212, 170, 0.3)",
        "glow-danger": "0 0 20px rgba(230, 57, 70, 0.5), 0 0 40px rgba(230, 57, 70, 0.3)",
        "inner-glow": "inset 0 0 20px rgba(0, 212, 170, 0.1)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0, 212, 170, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 170, 0.03) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse at center, rgba(0, 212, 170, 0.1) 0%, transparent 70%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
