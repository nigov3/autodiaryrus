import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, MessageSquare, User as UserIcon, ShieldCheck } from "lucide-react";
import { Logo } from "../components/layout/Header.jsx";
import { decodeVin } from "../lib/vinApi";
import { useGarageStore } from "../store/useGarageStore";
import CarSilhouette from "../components/common/CarSilhouette.jsx";

/**
 * Онбординг: VIN → тизер-инсайты → регистрация (SMS/соцсети) → дашборд.
 * Цель UX: добавить авто за < 30 секунд.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const addCarFromVin = useGarageStore((s) => s.addCarFromVin);
  const login = useGarageStore((s) => s.login);

  const [step, setStep] = useState("vin"); // vin | scanning | insights | auth
  const [query, setQuery] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [authTab, setAuthTab] = useState("sms");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  const scan = (e) => {
    e.preventDefault();
    if (query.trim().length < 4) return;
    setStep("scanning");
    setTimeout(() => {
      const d = decodeVin(query);
      if (d) {
        setDecoded(d);
        setStep("insights");
      } else setStep("vin");
    }, 1700);
  };

  const finish = (name) => {
    login({ name: name || "Алекс" });
    addCarFromVin(decoded);
    navigate("/dashboard");
  };

  const sendSms = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    setCodeSent(true);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 font-mono text-xs text-faint">
            <span className={step !== "vin" ? "text-glow" : ""}>01 VIN</span>
            <span>→</span>
            <span className={step === "insights" || step === "auth" ? "text-glow" : ""}>02 ИНСАЙТЫ</span>
            <span>→</span>
            <span className={step === "auth" ? "text-glow" : ""}>03 АККАУНТ</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait">
          {step === "vin" && (
            <motion.div key="vin" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
              <h1 className="font-display text-[28px] sm:text-4xl font-bold">Добавьте автомобиль</h1>
              <p className="mt-2 text-sub">Введите VIN или госномер — декодируем марку, модель, год и комплектацию автоматически.</p>
              <form onSubmit={scan} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:p-5">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())}
                    className="input font-mono !pl-11 tracking-wider" placeholder="WVWZZZ17ZKW034567 или О123ВС797" aria-label="VIN или госномер" />
                </div>
                <button type="submit" className="btn-cta whitespace-nowrap" disabled={query.trim().length < 4}>
                  Сканировать <ArrowRight size={16} />
                </button>
              </form>
              <p className="mt-3 text-xs text-faint">
                Демо-режим: сработает любой ввод от 4 символов. Попробуйте «WVW», «2T», «WBA» или «JTM».
              </p>
            </motion.div>
          )}

          {step === "scanning" && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
              <div className="relative mx-auto h-[240px] max-w-[560px] overflow-hidden rounded-card border border-line bg-card shadow-lg">
                <div className="absolute inset-0 grid place-items-center px-10">
                  <CarSilhouette stroke="#00D6FF" />
                </div>
                <div className="pointer-events-none absolute inset-x-0">
                  <div className="animate-scanline absolute h-[2px] w-full bg-gradient-to-r from-transparent via-glow to-transparent shadow-[0_0_18px_rgba(0,214,255,.8)]" />
                </div>
                <span className="hud-corner left-4 top-4 border-l border-t" />
                <span className="hud-corner right-4 top-4 border-r border-t" />
                <span className="hud-corner bottom-4 left-4 border-b border-l" />
                <span className="hud-corner bottom-4 right-4 border-b border-r" />
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs text-glow animate-pulse">
                  СБОРКА АВТОМОБИЛЯ ИЗ ЧАСТИЦ… ДЕКОДИРУЕМ VIN
                </span>
              </div>
            </motion.div>
          )}

          {step === "insights" && decoded && (
            <motion.div key="ins" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="space-y-5">
              <div className="card p-6">
                <p className="font-mono text-xs text-glow">{decoded.fullVin}</p>
                <h2 className="font-display text-2xl font-semibold mt-1">
                  {decoded.brand} {decoded.model} <span className="text-sub text-base font-normal">{decoded.year} · {decoded.trim}</span>
                </h2>
                <p className="mt-1 text-sm text-sub">{decoded.engine} · {decoded.transmission} · привод {decoded.drive}</p>
                <div className="mt-4 rounded-2xl border border-line bg-cardalt p-4">
                  <CarSilhouette stroke="#00D6FF" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="card p-5">
                  <h3 className="mb-2 text-sm font-semibold text-warn">Типичные проблемы модели</h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-sub marker:text-warn/60">
                    {decoded.commonIssues.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
                <div className="card p-5">
                  <h3 className="mb-2 text-sm font-semibold text-bad">Отзывные кампании</h3>
                  {decoded.recalls.length ? decoded.recalls.map((r) => (
                    <div key={r.code} className="text-sm">
                      <p className="text-ink">{r.name}</p>
                      <p className="font-mono text-xs text-faint">{r.code} · от {r.date}</p>
                    </div>
                  )) : <p className="text-sm text-ok">Активных кампаний нет ✦</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setStep("vin")} className="btn-ghost">Другой VIN</button>
                <button onClick={() => setStep("auth")} className="btn-cta">
                  <ShieldCheck size={16} /> Сохранить в гараж
                </button>
              </div>
            </motion.div>
          )}

          {step === "auth" && decoded && (
            <motion.div key="auth" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8 max-w-md mx-auto">
              <h2 className="font-display text-xl font-semibold">Почти готово</h2>
              <p className="mt-1 text-sm text-sub">
                {decoded.brand} {decoded.model} ждёт в гараже. Привяжите аккаунт, чтобы включить дневник расходов, штрафы и запчасти.
              </p>

              <div className="mt-5 grid grid-cols-3 rounded-2xl border border-line bg-cardalt p-1">
                {[["sms", MessageSquare, "SMS"], ["ya", null, "Яндекс"], ["vk", null, "VK"]].map(([t, Ico, label]) => (
                  <button key={t} onClick={() => setAuthTab(t)}
                    className={`rounded-xl py-2 text-sm font-medium transition-colors ${authTab === t ? "bg-accent/15 text-ink" : "text-faint hover:text-sub"}`}>
                    {Ico ? <Ico size={15} className="inline mr-1" /> : <span className="mr-1 font-display">{label[0]}</span>}
                    {label}
                  </button>
                ))}
              </div>

              {authTab === "sms" ? (
                <div className="mt-5 space-y-3">
                  {!codeSent ? (
                    <>
                      <input className="input font-mono" placeholder="+7 900 000-00-00" value={phone}
                        onChange={(e) => setPhone(e.target.value)} aria-label="Телефон" />
                      <button onClick={sendSms} className="btn-cta w-full">Получить код</button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-faint">Код отправлен на {phone} (демо: любой 4-значный)</p>
                      <input className="input font-mono text-center tracking-[0.5em]" maxLength={4} placeholder="••••"
                        value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Код из SMS" />
                      <button onClick={() => finish()} disabled={code.length < 4} className="btn-cta w-full disabled:opacity-40">
                        Войти и сохранить авто
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-5 space-y-2.5">
                  {["Яндекс ID", "VK ID", "Google"].map((p) => (
                    <button key={p} onClick={() => finish(`Владелец · ${p}`)} className="btn-ghost w-full justify-start gap-3">
                      <UserIcon size={15} className="text-glow" /> Продолжить через {p}
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-4 text-center text-xs text-faint">
                Нажимая кнопку, вы принимаете политику конфиденциальности.{" "}
                <Link to="/" className="text-glow hover:underline">Отмена</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
