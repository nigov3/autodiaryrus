import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 46 }, (_, i) => ({
  id: i,
  x: 8 + ((i * 37) % 84), // % внутри контейнера — «разлетаются» к силуэту
  y: 12 + ((i * 53) % 70),
  d: (i % 9) * 0.06,
}));

/**
 * Анимация «сканирования»: частицы слетаются в силуэт авто,
 * по car-области бегут scanline и HUD-рамка.
 */
export default function VinScanAnimation() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none" aria-hidden="true">
      {/* сетка-подложка */}
      <svg viewBox="0 0 520 240" className="w-full opacity-[0.15]">
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="240" stroke="#0066FF" strokeWidth="1" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="520" y2={i * 40} stroke="#0066FF" strokeWidth="1" />
        ))}
      </svg>

      {/* частицы */}
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-1 w-1 rounded-full bg-glow"
          style={{ left: `${p.x}%`, top: `${p.y}%`, boxShadow: "0 0 6px #00D6FF" }}
          initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1.2, 1, 0.6],
            x: [0, (260 - p.x * 5.2) * 0.12],
            y: [0, (150 - p.y * 2.4) * 0.12],
          }}
          transition={{ duration: 1.6, delay: p.d, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
        />
      ))}

      {/* силуэт */}
      <div className="absolute inset-x-0 bottom-4 px-6">
        <motion.svg
          viewBox="0 0 480 190"
          className="w-full"
          fill="none"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 1, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.path
            d="M32 138 C30 120 34 112 52 108 L92 100 C112 74 150 56 208 54 C262 52 300 64 322 88 L384 96 C420 100 446 108 450 122 C453 132 450 138 444 140 M60 142 A26 26 0 0 1 112 142 L188 142 A26 26 0 0 1 240 142 L368 142 A26 26 0 0 1 420 142"
            stroke="#00D6FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle cx="86" cy="142" r="26" stroke="#0066FF" strokeWidth="2.5" />
          <circle cx="394" cy="142" r="26" stroke="#0066FF" strokeWidth="2.5" />
        </motion.svg>
      </div>

      {/* scanline */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-full overflow-hidden">
        <motion.div
          className="h-[2px] w-full rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #00D6FF 30%, #0066FF 70%, transparent)",
            boxShadow: "0 0 18px rgba(0,214,255,.7)",
          }}
          animate={{ y: ["4%", "88%", "4%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* HUD-данные */}
      <motion.div
        className="absolute left-3 top-3 font-mono text-[10px] leading-relaxed text-glow/80"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      >
        <div>SCAN ▸ VIN LOCK</div>
        <div>WMI · VDS · VIS</div>
      </motion.div>
      <motion.div
        className="absolute right-3 top-3 font-mono text-[10px] text-sub"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        DECODING…
      </motion.div>
    </div>
  );
}
