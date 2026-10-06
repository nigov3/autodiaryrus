import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cog, Search, ExternalLink, Check, ChevronRight } from "lucide-react";
import { AppShell, PageTitle } from "../components/layout/Header.jsx";
import CarSilhouette from "../components/common/CarSilhouette.jsx";
import HudFrame, { Badge } from "../components/common/ui.jsx";
import { useActiveCar } from "../hooks/useStats";
import { rub, num } from "../lib/format";

/* ---------- Каталог узлов и запчастей (демо; в prod — Exist/Autodoc API по VIN) ---------- */
const NODES = [
  { id: "engine", label: "Двигатель", x: 210, y: 78 },
  { id: "brakes", label: "Тормоза", x: 86, y: 142 },
  { id: "front", label: "Передняя подвеска", x: 150, y: 150 },
  { id: "rear", label: "Задняя подвеска", x: 340, y: 150 },
  { id: "filter", label: "Фильтры", x: 262, y: 96 },
  { id: "body", label: "Кузов и оптика", x: 430, y: 112 },
];

const PARTS_DB = {
  engine: [
    { name: "Комплект цепи ГРМ", art: "06K109467AD", brand: "VAG", oem: { price: 18900, stock: 4 }, analogs: [{ name: "INA Chain Kit", brand: "INA", price: 12400, rating: 4.7, stock: 12 }, { name: "Febi Цепь", brand: "Febi", price: 9800, rating: 4.3, stock: 7 }], used: { price: 6500, cond: "контракт, Япония", stock: 2 } },
    { name: "Помпа + термостат", art: "06K121111H", brand: "VAG", oem: { price: 14200, stock: 6 }, analogs: [{ name: "Wahler Water Pump", brand: "Wahler", price: 8900, rating: 4.6, stock: 9 }], used: null },
  ],
  brakes: [
    { name: "Колодки тормозные передние", art: "5Q0698451J", brand: "ATE", oem: { price: 7400, stock: 15 }, analogs: [{ name: "TRW GDB1934", brand: "TRW", price: 4900, rating: 4.8, stock: 30 }, { name: "NiBK PN1204", brand: "NiBK", price: 3200, rating: 4.1, stock: 18 }], used: null },
    { name: "Диск тормозной передний", art: "5Q0615301G", brand: "Zimmermann", oem: { price: 9600, stock: 8 }, analogs: [{ name: "Zimmermann Zoom", brand: "Zimmermann", price: 6700, rating: 4.5, stock: 21 }], used: { price: 3000, cond: "пробег 12 тыс. км", stock: 4 } },
  ],
  front: [
    { name: "Стойка амортизатора передняя", art: "1K0413031BD", brand: "Sachs", oem: { price: 16800, stock: 3 }, analogs: [{ name: "KYB Excel-G", brand: "KYB", price: 10400, rating: 4.4, stock: 10 }], used: null },
    { name: "Рычаг передний нижний", art: "1K0407151J", brand: "Lemförder", oem: { price: 8900, stock: 9 }, analogs: [{ name: "Febi Рычаг", brand: "Febi", price: 5600, rating: 4.2, stock: 14 }], used: { price: 2800, cond: "оригинал, б/у", stock: 3 } },
  ],
  rear: [
    { name: "Ступичный подшипник", art: "7U0598611", brand: "SKF", oem: { price: 8200, stock: 11 }, analogs: [{ name: " FAG 713614780", brand: "FAG", price: 5900, rating: 4.6, stock: 16 }], used: null },
    { name: "Пружина задняя", art: "1K0511115AC", brand: "VAG", oem: { price: 6400, stock: 5 }, analogs: [{ name: "Lesjofors", brand: "Lesjofors", price: 4100, rating: 4.3, stock: 12 }], used: null },
  ],
  filter: [
    { name: "Фильтр масляный", art: "06K115561H", brand: "VAG", oem: { price: 1450, stock: 50 }, analogs: [{ name: "Mann MU70018", brand: "Mann", price: 900, rating: 4.9, stock: 120 }, { name: "Filtron OP613", brand: "Filtron", price: 550, rating: 4.5, stock: 80 }], used: null },
    { name: "Фильтр салонный (угольный)", art: "1K1819653B", brand: "VAG", oem: { price: 2300, stock: 25 }, analogs: [{ name: "Mann CUK2939", brand: "Mann", price: 1300, rating: 4.8, stock: 60 }], used: null },
    { name: "Фильтр воздушный", art: "1K0129620D", brand: "VAG", oem: { price: 3100, stock: 12 }, analogs: [{ name: "Filtron AR5015", brand: "Filtron", price: 1700, rating: 4.6, stock: 34 }], used: null },
  ],
  body: [
    { name: "Фара левая (LED)", art: "5Q0941003K", brand: "VAG", oem: { price: 42500, stock: 2 }, analogs: [{ name: "Depo LED", brand: "Depo", price: 18900, rating: 3.9, stock: 6 }], used: { price: 12000, cond: "разбор, РФ", stock: 3 } },
    { name: "Бампер передний", art: "5Q0807217R", brand: "VAG", oem: { price: 28900, stock: 4 }, analogs: [{ name: "Prinst Бампер", brand: "Prinst", price: 13500, rating: 4.0, stock: 8 }], used: { price: 8500, cond: "окрас Dark Gray", stock: 2 } },
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.28, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] } }),
};

/* ---------- Карточка запчасти со сравнением цен ---------- */
function PartCard({ part }) {
  const [tab, setTab] = useState("all");
  const minPrice = Math.min(
    part.oem?.price ?? Infinity,
    ...(part.analogs || []).map((a) => a.price),
    part.used?.price ?? Infinity
  );
  return (
    <motion.div layout variants={fadeUp} className="card card-hover p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-ink">{part.name}</h4>
          <p className="mt-0.5 font-mono text-xs text-faint">
            {part.art} · {part.brand}
          </p>
        </div>
        {part.oem && <Badge tone="ok">от {rub(part.oem.price)}</Badge>}
      </div>

      {/* Варианты: оригинал / аналог / б/у в одной карточке */}
      <div className="mt-4 space-y-2.5">
        {part.oem && tab !== "analogs" && tab !== "used" && (
          <VariantRow tone="ok" badge="Оригинал" title={`${part.brand} ${part.art}`}
            price={part.oem.price} note={`в наличии: ${part.oem.stock} шт.`} best={part.oem.price === minPrice} />
        )}
        {(part.analogs || []).filter(() => tab !== "oem" && tab !== "used").map((a) => (
          <VariantRow key={a.name} tone="warn" badge="Аналог" title={`${a.name} · ${a.brand}`}
            price={a.price} note={`рейтинг ${a.rating} · в наличии: ${a.stock}`} best={a.price === minPrice} />
        ))}
        {part.used && tab !== "oem" && tab !== "analogs" && (
          <VariantRow tone="used" badge="Б/У" title={part.used.cond}
            price={part.used.price} note={`штук: ${part.used.stock}`} best={part.used.price === minPrice} />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {[["all", "Все"], ["oem", "Ориг."], ["analogs", "Аналоги"], ["used", "Б/У"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                tab === t ? "border-accent/60 bg-accent/10 text-ink" : "border-line text-faint hover:text-sub"
              }`}>
              {l}
            </button>
          ))}
        </div>
        <button className="btn-ghost !py-1.5 !px-3 text-xs">
          <ExternalLink size={13} /> Exist
        </button>
      </div>
    </motion.div>
  );
}

function VariantRow({ tone, badge, title, price, note, best }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${best ? "border-ok/50 bg-ok/[0.05]" : "border-line bg-cardalt"}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Badge tone={tone}>{badge}</Badge>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{title}</p>
          <p className="text-xs text-faint">{note}</p>
        </div>
      </div>
      <span className="font-mono text-sm font-semibold shrink-0" style={{ color: best ? "#00D68F" : "#fff" }}>
        {rub(price)}
      </span>
    </div>
  );
}

/* ---------- Интерактивная SVG-схема ---------- */
function CarSchema({ active, onSelect }) {
  return (
    <svg viewBox="0 0 480 200" className="w-full select-none" fill="none" role="group" aria-label="Схема автомобиля">
      <g transform="translate(0,4)">
        <CarSilhouette stroke="#2A2F3E" fill="rgba(42,47,62,.15)" />
      </g>
      {NODES.map((n) => {
        const isActive = active === n.id;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer" onClick={() => onSelect(n.id)}>
            {isActive && <circle r="16" fill="rgba(0,214,255,.12)" stroke="#00D6FF" strokeWidth="1" />}
            <circle r={isActive ? 8 : 6} fill={isActive ? "#00D6FF" : "#141824"} stroke={isActive ? "#00D6FF" : "#8B92A8"} strokeWidth="2">
              <animate attributeName="opacity" values={isActive ? "1;0.6;1" : "1"} dur="1.6s" repeatCount="indefinite" />
            </circle>
            <text x="0" y={isActive ? -22 : -14} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace"
              fill={isActive ? "#00D6FF" : "#5A6178"}>
              {n.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PartsPage() {
  const { car } = useActiveCar();
  const [node, setNode] = useState("engine");
  const [q, setQ] = useState("");

  const parts = useMemo(() => {
    const list = PARTS_DB[node] || [];
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(s) || p.art.toLowerCase().includes(s));
  }, [node, q]);

  if (!car) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sub">Добавьте автомобиль — запчасти подбираются строго по VIN.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div initial="hidden" animate="show" className="space-y-6">
        <PageTitle
          title="Подбор запчастей"
          sub="Каталог собран по факту сборки вашего автомобиля"
          action={
            <span className="chip chip-active cursor-default font-mono text-xs">
              VIN: {car.fullVin || car.vin}
            </span>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Схема */}
          <motion.div variants={fadeUp} custom={0} className="lg:sticky lg:top-24 self-start">
            <HudFrame>
              <div className="card p-5">
                <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
                  <Cog size={15} className="text-glow" /> Техническая схема
                </h3>
                <p className="mb-3 text-xs text-faint">Выберите узел — справа появятся артикулы именно для вашей комплектации.</p>
                <div className="rounded-2xl border border-line bg-cardalt p-3">
                  <CarSchema active={node} onSelect={setNode} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {NODES.map((n) => (
                    <button key={n.id} onClick={() => setNode(n.id)}
                      className={`chip justify-start ${node === n.id ? "chip-active" : ""}`}>
                      <ChevronRight size={12} /> {n.label}
                    </button>
                  ))}
                </div>
              </div>
            </HudFrame>
          </motion.div>

          {/* Список запчастей */}
          <motion.div variants={fadeUp} custom={1} className="space-y-4">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                className="input !pl-11" placeholder="Поиск по названию или артикулу…" aria-label="Поиск запчастей" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={node + q} className="space-y-4">
                {parts.map((p) => <PartCard key={p.art} part={p} />)}
                {!parts.length && (
                  <div className="card p-10 text-center text-sm text-faint">
                    Ничего не найдено в узле «{NODES.find((n) => n.id === node)?.label}».
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <p className="flex items-center gap-2 text-xs text-faint">
              <Check size={13} className="text-ok" /> Цены агрегируются из Exist / Autodoc (демо-датасет). Совместимость проверена по VIN {car.fullVin || car.vin}.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
}
