import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, ShieldAlert, AlertTriangle, Sparkles, ScanLine } from "lucide-react";
import { decodeVin } from "../../lib/vinApi";
import { useGarageStore } from "../../store/useGarageStore";
import CarSilhouette from "../common/CarSilhouette.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function VinTizer() {
  const navigate = useNavigate();
  const addCarFromVin = useGarageStore((s) => s.addCarFromVin);
  const login = useGarageStore((s) => s.login);

  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | scanning | result
  const [decoded, setDecoded] = useState(null);

  const onScan = () => {
    if (query.trim().length < 4) return;
    setPhase("scanning");
    setTimeout(() => {
      const d = decodeVin(query);
      setDecoded(d);
      setPhase(d ? "result" : "idle");
    }, 1800);
  };

  const saveAndContinue = () => {
    if (!decoded) return;
    login({ name: "Алекс" });
    addCarFromVin(decoded);
    navigate("/dashboard");
  };

  return (
    <div className="card p-5 sm:p-7">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="input" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onScan();
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  className="input font-mono !pl-11 tracking-wider"
                  placeholder="VIN или госномер — например WVWZZZ17ZKW…"
                  aria-label="VIN или государственный номер"
                />
              </div>
              <button type="submit" className="btn-cta whitespace-nowrap" disabled={query.trim().length < 4}>
                <ScanLine size={17} /> Проверить
              </button>
            </form>
            <p className="mt-3 text-xs text-faint">
              Бесплатно и без регистрации: покажем типичные проблемы и отзывные кампании по вашему VIN.
            </p>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-2">
            <div className="relative mx-auto h-[190px] max-w-[520px] overflow-hidden rounded-xl border border-line bg-cardalt">
              <div className="absolute inset-0 grid place-items-center px-8">
                <CarSilhouette stroke="#00D6FF" />
              </div>
              <div className="pointer-events-none absolute inset-x-0">
                <div className="animate-scanline absolute h-[2px] w-full bg-gradient-to-r from-transparent via-glow to-transparent shadow-[0_0_18px_rgba(0,214,255,.8)]" />
              </div>
              <span className="hud-corner left-3 top-3 border-l border-t" />
              <span className="hud-corner right-3 top-3 border-r border-t" />
              <span className="hud-corner bottom-3 left-3 border-b border-l" />
              <span className="hud-corner bottom-3 right-3 border-b border-r" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-xs text-glow animate-pulse">
                ДЕКОДИРУЕМ VIN…
              </span>
            </div>
          </motion.div>
        )}

        {phase === "result" && decoded && (
          <motion.div key="result" initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-5">
            <motion.div variants={fadeUp} custom={0} className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-glow">{decoded.fullVin}</p>
                <h3 className="font-display text-xl font-semibold mt-1">
                  {decoded.brand} {decoded.model}{" "}
                  <span className="text-sub font-sans text-base font-normal">
                    {decoded.year} · {decoded.trim}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-sub">
                  {decoded.engine} · {decoded.transmission} · привод {decoded.drive}
                </p>
              </div>
              <span className="chip chip-active cursor-default">✓ VIN распознан</span>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-warn/30 bg-warn/[0.06] p-4">
                <div className="mb-2 flex items-center gap-2 text-warn text-sm font-semibold">
                  <AlertTriangle size={16} /> Типичные проблемы модели
                </div>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-sub marker:text-warn/60">
                  {decoded.commonIssues.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-bad/30 bg-bad/[0.06] p-4">
                <div className="mb-2 flex items-center gap-2 text-bad text-sm font-semibold">
                  <ShieldAlert size={16} /> Отзывные кампании
                </div>
                {decoded.recalls.length ? (
                  decoded.recalls.map((r) => (
                    <div key={r.code} className="text-sm">
                      <p className="text-ink">{r.name}</p>
                      <p className="font-mono text-xs text-faint">
                        {r.code} · от {r.date}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ok">Активных отзывных кампаний не найдено ✦</p>
                )}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={2} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-sub">
                <Sparkles size={15} className="text-premium" />
                Зарегистрируйтесь, чтобы сохранить авто и включить дневник расходов, штрафы и подбор запчастей.
              </p>
              <div className="flex gap-2">
                <button onClick={saveAndContinue} className="btn-cta">
                  Сохранить в гараж <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setPhase("idle");
                    setDecoded(null);
                  }}
                  className="btn-ghost"
                >
                  Другой VIN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
