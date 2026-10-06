import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  ShieldAlert,
  ReceiptText,
  Cog,
  Fuel,
  Gauge,
  ArrowRight,
  Plus,
  Wrench,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { AppShell, PageTitle } from "../components/layout/Header.jsx";
import CarSilhouette from "../components/common/CarSilhouette.jsx";
import HudFrame, { Badge, Progress } from "../components/common/ui.jsx";
import { useActiveCar, useExpensesStats } from "../hooks/useStats";
import { HEALTH_LABELS, healthColor, catById } from "../lib/categories";
import { rub, num, dateFullRu, dateRu } from "../lib/format";
import { loadDemo } from "../store/useGarageStore";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.28, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] } }),
};

const daysLeft = (iso) => Math.ceil((new Date(iso) - new Date()) / 86400000);

function EmptyGarage() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-card border border-line shadow-glow">
        <Plus size={30} className="text-glow" />
      </div>
      <h2 className="font-display text-2xl font-semibold">Гараж пуст</h2>
      <p className="mt-2 text-sub">Добавьте автомобиль по VIN — и весь сервис начнёт работать в контексте вашей машины.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/onboarding" className="btn-cta">Добавить авто</Link>
        <button onClick={loadDemo} className="btn-ghost">Посмотреть демо</button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { car, history } = useActiveCar();
  const stats = useExpensesStats();

  const alerts = useMemo(() => {
    if (!car) return [];
    const a = [];
    const kmToService = car.nextServiceKm - car.mileage;
    if (kmToService <= 3000)
      a.push({ tone: "bad", icon: CalendarClock, text: `ТО через ${num(kmToService, 0)} км — запишитесь заранее`, to: "/parts" });
    const dIns = daysLeft(car.osagoExpiry);
    if (dIns <= 45)
      a.push({ tone: dIns <= 14 ? "bad" : "warn", icon: ShieldCheck, text: `ОСАГО истекает ${dateFullRu(car.osagoExpiry)} (${dIns} дн.)`, to: "/profile" });
    const openFines = (car.fines || []).filter((f) => f.status === "open");
    if (openFines.length)
      a.push({ tone: "warn", icon: AlertTriangle, text: `${openFines.length} неоплачен${openFines.length > 1 ? "ных" : ""} штраф(а) на ${rub(openFines.reduce((s, f) => s + f.amount, 0))}`, to: "/profile" });
    if ((car.health?.oil ?? 100) < 40)
      a.push({ tone: "bad", icon: Wrench, text: "Состояние масла ниже нормы — рекомендуется замена", to: "/expenses" });
    return a;
  }, [car]);

  if (!car) {
    return (
      <AppShell>
        <EmptyGarage />
      </AppShell>
    );
  }

  const kmToService = car.nextServiceKm - car.mileage;
  const dIns = daysLeft(car.osagoExpiry);
  const openFines = (car.fines || []).filter((f) => f.status === "open");

  const QUICK = [
    { to: "/expenses?add=1", icon: Plus, label: "Добавить расход", sub: "< 15 секунд", color: "#0066FF" },
    { to: "/parts", icon: Cog, label: "Подбор запчастей", sub: "строго по VIN", color: "#00D6FF" },
    { to: "/expenses", icon: ReceiptText, label: "Дневник расходов", sub: `${rub(stats.monthTotal)} за месяц`, color: "#FF6B35" },
    { to: "/profile", icon: ShieldAlert, label: "Штрафы и полисы", sub: openFines.length ? `${openFines.length} неоплач.` : "чисто", color: "#8B5CF6" },
  ];

  return (
    <AppShell>
      <motion.div initial="hidden" animate="show" className="space-y-6">
        <PageTitle
          title={`Мой гараж`}
          sub={`${car.brand} ${car.model} · ${car.year} г. · ${car.body}`}
          action={<Link to="/onboarding" className="btn-ghost"><Plus size={15}/> Другой автомобиль</Link>}
        />

        {/* Карточка авто + сводка */}
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <HudFrame>
            <motion.div variants={fadeUp} custom={0} className="card p-6 h-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-glow">{car.fullVin || car.vin}</p>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1">
                    {car.brand} {car.model}
                  </h2>
                  <p className="mt-1 text-sm text-sub">{car.trim}</p>
                </div>
                <span className="chip chip-active cursor-default font-mono">{car.plate}</span>
              </div>

              <div className="relative my-4 rounded-2xl border border-line bg-cardalt px-6 py-2 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_80%,rgba(0,102,255,.14),transparent)]" />
                <CarSilhouette stroke="#00D6FF" />
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs text-faint sm:grid-cols-4">
                <span>▸ {car.engine}</span>
                <span>▸ {car.transmission}</span>
                <span>▸ привод {car.drive}</span>
                <span>▸ {car.color}</span>
              </div>

              {/* Здоровье */}
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">Индикаторы здоровья</h3>
                {Object.entries(car.health || {}).map(([key, val], i) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm text-sub">{HEALTH_LABELS[key] || key}</span>
                    <Progress value={val} color={healthColor(val)} />
                    <span className="w-10 text-right font-mono text-sm" style={{ color: healthColor(val) }}>
                      {val}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </HudFrame>

          {/* Сводка */}
          <motion.div variants={fadeUp} custom={1} className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <SummaryCard icon={CalendarClock} tone="accent" label="Следующее ТО"
              value={kmToService > 0 ? `${num(kmToService, 0)} км` : "просрочено"}
              hint={`до ${num(car.nextServiceKm, 0)} км · интервал ${num(car.serviceInterval, 0)} км`} />
            <SummaryCard icon={ShieldAlert} tone={openFines.length ? "warn" : "ok"} label="Штрафы"
              value={openFines.length ? rub(openFines.reduce((s, f) => s + f.amount, 0)) : "0 ₽"}
              hint={openFines.length ? `${openFines.length} неоплаченных` : "не найдено"} />
            <SummaryCard icon={Fuel} tone="fuel" label="Расход в месяц"
              value={rub(stats.avgMonth)}
              hint={`в среднем с начала года`} />
            <SummaryCard icon={ShieldCheck} tone={dIns <= 14 ? "bad" : dIns <= 45 ? "warn" : "ok"} label="Полис ОСАГО"
              value={dIns > 0 ? `${dIns} дн.` : "истёк"}
              hint={`до ${dateFullRu(car.osagoExpiry)}`} />
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-sub"><Gauge size={15} className="text-glow" /> Пробег</span>
                <span className="font-mono text-ink">{num(car.mileage, 0)} км</span>
              </div>
              <div className="mt-2.5">
                <Progress value={(car.mileage % car.serviceInterval) / car.serviceInterval * 100} color="#0066FF" height={6} />
                <p className="mt-1.5 font-mono text-[11px] text-faint">
                  {(car.mileage % car.serviceInterval).toLocaleString("ru-RU")} км с последнего ТО
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Быстрые действия */}
        <motion.div variants={fadeUp} custom={2} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="card card-hover group p-4 sm:p-5">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-line bg-cardalt transition-colors group-hover:border-accent/60"
                style={{ color: q.color }}>
                <q.icon size={19} strokeWidth={1.8} />
              </span>
              <p className="font-medium text-sm sm:text-[15px]">{q.label}</p>
              <p className="mt-0.5 text-xs text-faint">{q.sub}</p>
            </Link>
          ))}
        </motion.div>

        {/* Алерты */}
        {alerts.length > 0 && (
          <motion.div variants={fadeUp} custom={3} className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
              <AlertTriangle size={15} className="text-warn" /> Что нужно сейчас
            </h3>
            <div className="space-y-2">
              {alerts.map((al, i) => (
                <Link key={i} to={al.to}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors hover:bg-cardalt ${
                    al.tone === "bad" ? "border-bad/30 bg-bad/[0.05]" : "border-warn/30 bg-warn/[0.05]"
                  }`}>
                  <span className="flex items-center gap-3 text-sm">
                    <al.icon size={16} className={al.tone === "bad" ? "text-bad" : "text-warn"} />
                    <span className="text-ink">{al.text}</span>
                  </span>
                  <ArrowRight size={15} className="text-faint shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* История обслуживания */}
        <motion.div variants={fadeUp} custom={4} className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">История обслуживания</h3>
            <Link to="/expenses" className="text-sm text-glow hover:underline">Все записи</Link>
          </div>
          <ol className="relative ml-2 space-y-5 border-l border-line pl-6">
            {history.slice(0, 6).map((h) => {
              const c = catById(h.cat);
              return (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2"
                    style={{ borderColor: c.color, background: "#141824" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{h.title}</p>
                    <p className="font-mono text-sm text-sub">{rub(h.cost)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-faint">{dateFullRu(h.date)} · {h.place}</p>
                </li>
              );
            })}
            {!history.length && (
              <li className="text-sm text-faint">Пока пусто — записи появятся здесь автоматически.</li>
            )}
          </ol>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, tone, label, value, hint }) {
  const tones = { accent: "text-glow", ok: "text-ok", warn: "text-warn", bad: "text-bad", fuel: "text-[#FF6B35]" };
  return (
    <div className="card card-hover p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        <Icon size={14} className={tones[tone]} /> {label}
      </p>
      <p className="mt-2 font-mono text-xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-faint">{hint}</p>
    </div>
  );
}
