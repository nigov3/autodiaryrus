import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  ShieldAlert,
  Check,
  Banknote,
  Trash2,
  LogOut,
  Plus,
  Car as CarIcon,
  ChevronRight,
} from "lucide-react";
import { AppShell, PageTitle } from "../components/layout/Header.jsx";
import { Badge } from "../components/common/ui.jsx";
import { useActiveCar } from "../hooks/useStats";
import { useGarageStore } from "../store/useGarageStore";
import { rub, num, dateFullRu } from "../lib/format";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.28, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] } }),
};

/* ---------- Штрафы ГИБДД (демо-данные на авто) ---------- */
function FinesBlock({ car }) {
  const payFine = useGarageStore((s) => s.payFine);
  const fines = car.fines || [];
  const open = fines.filter((f) => f.status === "open");
  return (
    <motion.div variants={fadeUp} custom={2} className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldAlert size={17} className="text-warn" /> Штрафы ГИБДД
        </h3>
        <span className="font-mono text-xs text-faint">{car.plate} · {car.vin?.slice(-6).toUpperCase()}</span>
      </div>
      {!fines.length && <p className="text-sm text-ok">Неоплаченных штрафов нет ✦ Проверка по базе ГИБДД (демо).</p>}
      <ul className="space-y-2.5">
        {fines.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-cardalt p-3.5">
            <div>
              <p className="text-sm text-ink">{f.place}</p>
              <p className="mt-0.5 font-mono text-xs text-faint">{dateFullRu(f.date)} · № {f.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold">{rub(f.amount)}</span>
              {f.status === "open" ? (
                <button onClick={() => payFine(car.id, f.id)} className="btn-cta !py-2 !px-3.5 text-xs">
                  <Banknote size={14} /> Оплатить
                </button>
              ) : (
                <Badge tone="ok"><Check size={11} /> Оплачен</Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
      {open.length > 0 && (
        <p className="mt-3 text-xs text-faint">Скидка 50% при оплате в первые 30 дней не активна — срок вышел.</p>
      )}
    </motion.div>
  );
}

export default function ProfilePage() {
  const { car, cars } = useActiveCar();
  const user = useGarageStore((s) => s.user);
  const login = useGarageStore((s) => s.login);
  const logout = useGarageStore((s) => s.logout);
  const removeCar = useGarageStore((s) => s.removeCar);
  const setActiveCar = useGarageStore((s) => s.setActiveCar);
  const updateCarMileage = useGarageStore((s) => s.updateCarMileage);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [km, setKm] = useState("");

  return (
    <AppShell>
      <motion.div initial="hidden" animate="show" className="space-y-6 max-w-4xl">
        <PageTitle title="Профиль" sub="Аккаунт, автомобили, штрафы и страховка" />

        {/* Аккаунт */}
        <motion.div variants={fadeUp} custom={0} className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cta text-white shadow-glow">
                <User size={22} />
              </span>
              {user ? (
                <div>
                  <p className="font-display text-lg font-semibold">{user.name}</p>
                  <p className="text-xs text-faint">Ваш гараж синхронизирован локально · демо-режим</p>
                </div>
              ) : (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) login({ name: name.trim() }); }}>
                  <input className="input !w-56" placeholder="Имя для входа" value={name} onChange={(e) => setName(e.target.value)} />
                  <button className="btn-cta">Войти</button>
                </form>
              )}
            </div>
            {user && (
              <button onClick={() => { logout(); navigate("/"); }} className="btn-ghost">
                <LogOut size={15} /> Выйти
              </button>
            )}
          </div>
        </motion.div>

        {/* Мои автомобили */}
        <motion.div variants={fadeUp} custom={1} className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <CarIcon size={17} className="text-glow" /> Мой гараж · {cars.length}
            </h3>
            <Link to="/onboarding" className="btn-ghost !py-2 text-xs"><Plus size={14} /> Добавить авто</Link>
          </div>
          <ul className="space-y-2.5">
            {cars.map((c) => (
              <li key={c.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                  car?.id === c.id ? "border-accent/50 bg-accent/[0.06]" : "border-line bg-cardalt"
                }`}>
                <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => setActiveCar(c.id)}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${car?.id === c.id ? "bg-glow shadow-[0_0_8px_#00D6FF]" : "bg-line"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{c.brand} {c.model} · {c.year}</span>
                    <span className="block font-mono text-xs text-faint">{c.plate} · {num(c.mileage, 0)} км</span>
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  {car?.id === c.id && (
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (Number(km)) { updateCarMileage(c.id, Number(km)); setKm(""); } }}>
                      <input className="input !w-32 !py-2 font-mono text-sm" type="number" placeholder="Пробег" value={km} onChange={(e) => setKm(e.target.value)} />
                      <button className="btn-ghost !py-2 text-xs">OK</button>
                    </form>
                  )}
                  <Link to="/parts" className="btn-ghost !p-2.5" aria-label="Запчасти"><ChevronRight size={15} /></Link>
                  <button onClick={() => removeCar(c.id)} className="btn-ghost !p-2.5 hover:!border-bad/60 hover:text-bad" aria-label="Удалить авто">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
            {!cars.length && <li className="text-sm text-faint">Гараж пуст — добавьте первый автомобиль.</li>}
          </ul>
        </motion.div>

        {car && <FinesBlock car={car} />}

        {/* Страховка */}
        {car && (
          <motion.div variants={fadeUp} custom={3} className="card p-5 sm:p-6">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <CreditCard size={17} className="text-premium" /> Страхование
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-cardalt p-4">
                <p className="text-xs uppercase tracking-wider text-faint">ОСАГО</p>
                <p className="mt-1.5 font-mono text-lg text-ink">8 740 ₽/год</p>
                <p className="mt-1 text-xs text-sub">до {dateFullRu(car.osagoExpiry)}</p>
              </div>
              <div className="rounded-xl border border-line bg-cardalt p-4">
                <p className="text-xs uppercase tracking-wider text-faint">КАСКО (расчёт)</p>
                <p className="mt-1.5 font-mono text-lg text-ink">≈ 64 900 ₽</p>
                <p className="mt-1 text-xs text-sub">франшиза 10 тыс. · возраст 7 лет</p>
              </div>
              <button className="btn-cta self-center"><ShieldAlert size={16} /> Продлить ОСАГО</button>
            </div>
            <p className="mt-3 text-xs text-faint">Калькулятор сравнивает предложения agregator'ов API (демо-оценка по КБМ и региону Москва).</p>
          </motion.div>
        )}

        <p className="text-center font-mono text-xs text-faint pb-4">
          GARAGE v0.1 · MVP · данные хранятся в вашем браузере
        </p>
      </motion.div>
    </AppShell>
  );
}
