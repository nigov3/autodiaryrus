import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Fuel,
  Route,
  Wallet,
  CalendarDays,
  Trash2,
  MapPin,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { AppShell, PageTitle } from "../components/layout/Header.jsx";
import { useActiveCar, useExpensesStats } from "../hooks/useStats";
import { CATEGORIES, catById } from "../lib/categories";
import { rub, num, dateRu, dateFullRu } from "../lib/format";
import { useGarageStore } from "../store/useGarageStore";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.28, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] } }),
};

/* ---------- Модалка добавления расхода ---------- */
function AddExpenseModal({ open, onClose, carId }) {
  const addExpense = useGarageStore((s) => s.addExpense);
  const [cat, setCat] = useState("fuel");
  const [form, setForm] = useState({ desc: "", amount: "", km: "", liters: "", place: "" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const isFuel = cat === "fuel";

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.desc || !Number(form.amount)) return;
    addExpense(carId, {
      cat,
      desc: form.desc.trim(),
      amount: Number(form.amount),
      date,
      km: form.km ? Number(form.km) : undefined,
      liters: isFuel && form.liters ? Number(form.liters) : undefined,
      place: form.place?.trim() || undefined,
    });
    setForm({ desc: "", amount: "", km: "", liters: "", place: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
          role="dialog" aria-modal="true" aria-label="Добавить расход"
        >
          <motion.form
            onSubmit={submit}
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg card !rounded-b-none sm:!rounded-card max-h-[92vh] overflow-y-auto p-5 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Новый расход</h3>
              <button type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="Закрыть"><X size={17} /></button>
            </div>

            {/* Категории */}
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCat(c.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition-all min-h-[64px] ${
                    cat === c.id ? "border-accent bg-accent/10 text-ink shadow-glow" : "border-line bg-cardalt text-faint hover:text-sub"
                  }`}
                  style={cat === c.id ? { borderColor: c.color, background: `${c.color}14` } : null}>
                  <c.icon size={18} strokeWidth={1.8} style={{ color: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label" htmlFor="exp-desc">Описание</label>
                  <input id="exp-desc" className="input" placeholder="Лукойл АИ-95" value={form.desc} onChange={set("desc")} required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label" htmlFor="exp-amount">Сумма, ₽</label>
                  <input id="exp-amount" className="input font-mono" type="number" inputMode="decimal" min="1" placeholder="2640" value={form.amount} onChange={set("amount")} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="exp-date">Дата</label>
                  <input id="exp-date" className="input font-mono" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="exp-km">Пробег, км</label>
                  <input id="exp-km" className="input font-mono" type="number" inputMode="numeric" placeholder="87000" value={form.km} onChange={set("km")} />
                </div>
              </div>

              {isFuel && (
                <div>
                  <label className="label" htmlFor="exp-liters">Литры</label>
                  <input id="exp-liters" className="input font-mono" type="number" step="0.1" inputMode="decimal" placeholder="40" value={form.liters} onChange={set("liters")} />
                  <p className="mt-1 text-xs text-faint">Нужно для расчёта среднего расхода л/100 км.</p>
                </div>
              )}

              <div>
                <label className="label" htmlFor="exp-place">Место / примечание</label>
                <input id="exp-place" className="input" placeholder="Варшавское шоссе, СТО «Гараж 54»" value={form.place} onChange={set("place")} />
              </div>
            </div>

            <button type="submit" className="btn-cta mt-5 w-full">
              <Plus size={17} /> Добавить расход
            </button>
            <p className="mt-2 text-center text-xs text-faint">Среднее время внесения — менее 15 секунд ✦</p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Карточка статистики ---------- */
function StatCard({ icon: Icon, label, value, sub, delta, tone = "#00D6FF" }) {
  return (
    <motion.div variants={fadeUp} className="card card-hover p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        <Icon size={14} style={{ color: tone }} /> {label}
      </p>
      <p className="mt-2 font-mono text-xl sm:text-2xl font-semibold text-ink">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {delta != null && (
          <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${delta >= 0 ? "text-bad" : "text-ok"}`}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        {sub && <span className="text-xs text-faint">{sub}</span>}
      </div>
    </motion.div>
  );
}

/* ---------- Кастомный тултип бара ---------- */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-base px-3 py-2 shadow-lg">
      <p className="font-mono text-xs text-faint">{label}</p>
      <p className="font-mono text-sm font-semibold text-ink">{rub(payload[0].value)}</p>
    </div>
  );
}

export default function ExpensesPage() {
  const { car, expenses } = useActiveCar();
  const stats = useExpensesStats();
  const removeExpense = useGarageStore((s) => s.removeExpense);
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState(params.get("add") === "1");
  const [filter, setFilter] = useState("all");

  const openModal = () => {
    setModal(true);
    params.set("add", "1");
    setParams(params, { replace: true });
  };
  const closeModal = () => {
    setModal(false);
    params.delete("add");
    setParams(params, { replace: true });
  };

  if (!car) {
    return (
      <AppShell>
        <div className="py-16 text-center text-sub">Сначала добавьте автомобиль в гараж.</div>
      </AppShell>
    );
  }

  const list = (filter === "all" ? expenses : expenses.filter((e) => e.cat === filter)).slice(0, 30);
  const pieData = stats.byCat.map((c) => ({ name: c.name, value: c.total, color: c.color }));

  return (
    <AppShell>
      <motion.div initial="hidden" animate="show" className="space-y-6">
        <PageTitle
          title="Дневник расходов"
          sub={`${car.brand} ${car.model} · ${expenses.length} записей`}
          action={<button onClick={openModal} className="btn-cta"><Plus size={17} /> Добавить расход</button>}
        />

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Всего за год" value={rub(stats.yearTotal)} sub="2026" tone="#0066FF" />
          <StatCard icon={CalendarDays} label="За месяц" value={rub(stats.monthTotal)} delta={stats.monthDelta} sub="к прошлому" tone="#00D6FF" />
          <StatCard icon={Route} label="Стоимость 1 км" value={stats.costPerKm ? `${num(stats.costPerKm, 2)} ₽` : "—"} sub={`${num(stats.kmDriven, 0)} км за год`} tone="#8B5CF6" />
          <StatCard icon={Fuel} label="Средний расход" value={stats.fuelAvg ? `${num(stats.fuelAvg, 1)} л` : "—"} sub="на 100 км" tone="#FF6B35" />
        </div>

        {/* Графики */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Pie */}
          <motion.div variants={fadeUp} custom={1} className="card p-5 sm:p-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-faint">По категориям · год</h3>
            {pieData.length ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={72} outerRadius={100} paddingAngle={3} strokeWidth={0} animationDuration={700}>
                      {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} formatter={(v) => rub(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-mono text-lg font-semibold text-ink">{rub(stats.yearTotal)}</p>
                    <p className="text-xs text-faint">за год</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-faint">Нет трат в этом году</p>
            )}
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {stats.byCat.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-sub">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} /> {c.name}
                  </span>
                  <span className="font-mono text-faint">{Math.round((c.total / stats.yearTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Bars */}
          <motion.div variants={fadeUp} custom={2} className="card p-5 sm:p-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-faint">По месяцам · 2026</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byMonth} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3E" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8B92A8", fontSize: 12 }} axisLine={{ stroke: "#2A2F3E" }} tickLine={false} />
                <YAxis tick={{ fill: "#5A6178", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}к` : v)} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,102,255,.08)" }} />
                <Bar dataKey="value" radius={[8, 8, 4, 4]} animationDuration={700}>
                  {stats.byMonth.map((_, i) => (
                    <Cell key={i} fill={i === stats.byMonth.length - 1 ? "#0066FF" : "rgba(0,214,255,.45)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Фильтры + список */}
        <motion.div variants={fadeUp} custom={3} className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={() => setFilter("all")} className={`chip ${filter === "all" ? "chip-active" : ""}`}>
              Все
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)}
                className={`chip ${filter === c.id ? "chip-active" : ""}`}
                style={filter === c.id ? { borderColor: `${c.color}99`, color: c.color, background: `${c.color}12` } : null}>
                <c.icon size={13} style={{ color: filter === c.id ? c.color : undefined }} /> {c.name}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {list.map((e) => {
                const c = catById(e.cat);
                return (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: -12, backgroundColor: "rgba(0,102,255,.12)" }}
                    animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,102,255,0)" }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="group flex items-center gap-3 py-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border"
                      style={{ borderColor: `${c.color}44`, background: `${c.color}12`, color: c.color }}>
                      <c.icon size={17} strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{e.desc}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-xs text-faint">
                        <span>{dateRu(e.date)}</span>
                        {e.km && <span>· {num(e.km, 0)} км</span>}
                        {e.liters && <span>· {num(e.liters, 1)} л</span>}
                        {e.place && <span className="inline-flex items-center gap-1"><MapPin size={10} /> {e.place}</span>}
                      </p>
                    </div>
                    <span className="font-mono text-[15px] font-semibold" style={{ color: c.color }}>−{rub(e.amount)}</span>
                    <button onClick={() => removeExpense(car.id, e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-faint hover:text-bad" aria-label="Удалить">
                      <Trash2 size={15} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {!list.length && (
              <li className="py-10 text-center text-sm text-faint">
                Нет записей. Нажмите «Добавить расход», чтобы начать вести дневник.
              </li>
            )}
          </ul>
        </motion.div>
      </motion.div>

      <AddExpenseModal open={modal} onClose={closeModal} carId={car.id} />
    </AppShell>
  );
}
