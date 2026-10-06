import { motion } from "framer-motion";

export default function HudFrame({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="hud-corner left-2 top-2 border-l border-t" />
      <span className="hud-corner right-2 top-2 border-r border-t" />
      <span className="hud-corner bottom-2 left-2 border-b border-l" />
      <span className="hud-corner bottom-2 right-2 border-b border-r" />
      {children}
    </div>
  );
}

export function Badge({ tone = "accent", children, className = "" }) {
  const tones = {
    accent: "bg-accent/15 text-glow border-accent/40",
    ok: "bg-ok/15 text-ok border-ok/40",
    warn: "bg-warn/15 text-warn border-warn/40",
    bad: "bg-bad/15 text-bad border-bad/40",
    premium: "bg-premium/15 text-premium border-premium/40",
    used: "bg-[#3B82F6]/15 text-[#7FB2FF] border-[#3B82F6]/40",
    neutral: "bg-cardalt text-sub border-line",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Progress({ value, color, shimmer = true, height = 8 }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-cardalt border border-line" style={{ height }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        className="relative h-full rounded-full"
        style={{ background: color }}
      >
        {shimmer && (
          <div
            className="absolute inset-0 animate-shimmer rounded-full opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)",
              backgroundSize: "400px 100%",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return <div className={`skeleton h-24 ${className}`} />;
}
