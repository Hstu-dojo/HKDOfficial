/** @type {import('tailwindcss').Config} */
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      sm: "575px",
      md: "768px",
      lg: "1025px",
      xl: "1312px",
    },
    container: {
      center: true,
      padding: "1rem",
    },
    boxShadow: {
      none: "none",
      sm: "0 1px 6px rgba(61,65,84,.15)",
      md: "0 5px 15px rgba(61,65,84,.15)",
      lg: "0 20px 40px rgba(61,65,84,.15)",
    },
    fontSize: {
      xxs: ["0.75rem"],
      xs: ["0.875rem"],
      sm: ["0.9375rem"],
      base: ["1rem"],
      md: ["1.125rem"],
      lg: ["1.25rem"],
      xl: ["1.5rem"],
      "2xl": ["1.75rem", { lineHeight: "normal" }],
      "3xl": ["2.125rem", { lineHeight: "normal" }],
      "4xl": ["2.5rem", { lineHeight: "normal" }],
      "5xl": ["3rem", { lineHeight: "normal" }],
      "6xl": ["3.5rem", { lineHeight: "normal" }],
      "7xl": ["4rem", { lineHeight: "normal" }],
    },
    extend: {
      fontFamily: {
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        body: ["var(--font-jetbrains)", "monospace"],
      },
      zIndex: {
        60: 60,
        70: 70,
        80: 80,
        90: 90,
        100: 100,
      },
      colors: {
        slate: {
          base: "#64748B",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          850: "#141C2E",
          900: "#0F172A",
          950: "#020617",
        },
        yellow: "#fbc02d",
        green: "#44d88d",
        border: "hsl(var(--border, 192 12% 92%) / <alpha-value>)",
        input: "hsl(var(--input, 192 12% 92%) / <alpha-value>)",
        ring: "hsl(var(--ring, 222.2 84% 4.9%) / <alpha-value>)",
        background: "hsl(var(--background, 0 0% 100%) / <alpha-value>)",
        foreground: "hsl(var(--foreground, 231 35% 31%) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary, 189 100% 35%) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 260 84% 51%) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground, 0 0% 100%) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "#0CC0DF",
        },
        quaternary: {
          DEFAULT: "#fa6262",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground, 210 40% 98%) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 200 23% 97%) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground, 214 14% 48%) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 0 100% 50%) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground, 0 0% 100%) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground, 224 71.4% 4.1%) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground, 222.2 84% 4.9%) / <alpha-value>)",
        },
      },
      transitionTimingFunction: {
        "out-flex": "cubic-bezier(0.05, 0.6, 0.4, 0.9)",
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme("colors.secondary.DEFAULT"),
              "&:hover": {
                color: theme("colors.primary.DEFAULT"),
              },
            },
            "--tw-prose-bold": theme("colors.foreground"),
            "--tw-prose-quotes": theme("colors.foreground"),
          },
        },
      }),
      borderRadius: {
        xl: "1.25rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        1600: "1600ms",
      },
      keyframes: {
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
        fly: {
          "0%, 100%": { transform: "translateY(5%)" },
          "50%": { transform: "translateY(0)" },
        },
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(-4px)" },
          to: { opacity: 100, transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: 100, transform: "translateY(0)" },
          to: { opacity: 0, transform: "translateY(-4px)" },
        },
      },
      animation: {
        fly: "fly 6s cubic-bezier(0.75, 0.02, 0.31, 0.87) infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-in-out",
        "fade-out": "fade-out 0.2s ease-in-out",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        aurora: "aurora 60s linear infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    addVariablesForColors,
  ],
};
// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
// Colors that already reference CSS variables (hsl(var(--...))) are skipped to avoid circular refs.
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors)
      .filter(([, val]) => typeof val === "string" && !val.includes("var("))
      .map(([key, val]) => [`--${key}`, val]),
  );

  addBase({
    ":root": newVars,
  });
}
