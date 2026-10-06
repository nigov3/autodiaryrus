/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0E1A",
        card: "#141824",
        cardalt: "#1C2130",
        line: "#2A2F3E",
        ink: "#FFFFFF",
        sub: "#8B92A8",
        faint: "#5A6178",
        accent: "#0066FF",
        glow: "#00D6FF",
        ok: "#00D68F",
        warn: "#FFB800",
        bad: "#FF3B5C",
        premium: "#8B5CF6",
        fuel: "#FF6B35",
      },
      fontFamily: {
        display: ["Unbounded", "Manrope", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "24px",
        xl2: "20px",
        xl3: "28px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0,0,0,.35)",
        md: "0 8px 24px rgba(0,0,0,.45)",
        lg: "0 16px 48px rgba(0,0,0,.55)",
        glow: "0 0 24px rgba(0,102,255,.35)",
        "glow-cyan": "0 0 24px rgba(0,214,255,.3)",
      },
      backgroundImage: {
        cta: "linear-gradient(135deg,#0066FF,#00D6FF)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        scanline: { "0%": { top: "6%" }, "100%": { top: "92%" } },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        scanline: "scanline 1.4s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
