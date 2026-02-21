import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        slate: "#1B2733",
        mist: "#F5F5DC",
        beige: "#F5F5DC",
        lemon: "#FFFACD",
        aqua: "#3DD6C5",
        ember: "#FF7A59",
        leaf: "#2BB673",
        gold: "#F4B740",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))"
      },
      boxShadow: {
        glow: "0 0 40px rgba(61, 214, 197, 0.25)",
        soft: "0 10px 40px rgba(10, 15, 20, 0.12)"
      },
      backgroundImage: {
        "radial-grid": "radial-gradient(circle at 20% 20%, rgba(61, 214, 197, 0.15), transparent 45%), radial-gradient(circle at 80% 0%, rgba(244, 183, 64, 0.12), transparent 45%), radial-gradient(circle at 80% 80%, rgba(255, 122, 89, 0.12), transparent 45%)"
      }
    }
  },
  plugins: []
};

export default config;
