import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // shadcn semantic tokens (CSS-variable driven). Drive every primitive
        // under components/ui and let us add a dark theme later without churn.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // `primary` and `accent` keep numeric scales alongside the semantic
        // DEFAULT/foreground. Identité « La Revue » : sapin + terracotta.
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // Vert sapin — la marque (#1B4D3E = 800).
          50: "#f2f7f4",
          100: "#dfede6",
          200: "#c2dcce",
          300: "#9bc4ae",
          400: "#6fa68b",
          500: "#4c886d",
          600: "#356c55",
          700: "#275848",
          800: "#1b4d3e",
          900: "#143c30",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Terracotta — surlignages, prix, touches chaudes (#C65F3D = 500).
          400: "#d97e5f",
          500: "#c65f3d",
          600: "#ac4e2f",
          700: "#8e4026",
        },
        // Stone (gris chauds Tailwind) — remplace l'ancien slate, trop froid
        // pour le fond papier.
        neutral: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // UI : Public Sans, neutre et crédible.
        sans: ["Public Sans Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        // Titres : Fraunces, serif d'édition — la voix de la marque.
        display: ["Fraunces Variable", "Georgia", "ui-serif", "serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
