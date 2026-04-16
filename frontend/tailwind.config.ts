import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Turkcell Brand Colors Injection
        primary: "#2855ac",             // Turkcell Mavisi
        "primary-container": "#1b3f87", // Daha koyu lacivert
        "on-primary-container": "#ffffff",
        "on-primary": "#ffffff",
        
        secondary: "#ffc900",             // Turkcell Sarısı
        "secondary-container": "#e5b500", // Biraz daha koyu sarı
        "on-secondary-container": "#332a00",
        "on-secondary": "#1a1500",

        "on-secondary-fixed": "#231b00",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed-variant": "#005321",
        "on-background": "#191c1e",
        "tertiary-container": "#004b1e",
        "on-error": "#ffffff",
        "on-surface": "#191c1e",
        outline: "#757682",
        "secondary-fixed-dim": "#eec200",
        "on-primary-fixed": "#00164e",
        "surface-container-highest": "#e0e3e5",
        "surface-container-lowest": "#ffffff",
        "on-surface-variant": "#444651",
        tertiary: "#003211",
        "surface-dim": "#d8dadc",
        background: "#f7f9fb",
        "inverse-on-surface": "#eff1f3",
        "secondary-fixed": "#ffe083",
        "surface-bright": "#f7f9fb",
        "surface-container-low": "#f2f4f6",
        "inverse-primary": "#b6c4ff",
        "primary-fixed": "#dce1ff",
        surface: "#f7f9fb",
        "on-secondary-fixed-variant": "#574500",
        "surface-tint": "#2855ac",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "surface-container-high": "#e6e8ea",
        "outline-variant": "#c5c5d3",
        "inverse-surface": "#2d3133",
        "on-tertiary-fixed": "#002109",
        "on-primary-fixed-variant": "#264191",
        "tertiary-fixed-dim": "#4ae176",
        "on-tertiary-container": "#22c55e",
        "tertiary-fixed": "#6bff8f",
        "primary-fixed-dim": "#b6c4ff",
        "surface-variant": "#e0e3e5",
        error: "#ba1a1a",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
