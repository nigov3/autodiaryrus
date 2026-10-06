import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, User as UserIcon } from "lucide-react";
import { Logo } from "../components/layout/Header.jsx";
import { useGarageStore } from "../store/useGarageStore";

/** Быстрый вход (демо): SMS-код или соцсети. */
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useGarageStore((s) => s.login);
  const [tab, setTab] = useState("sms");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  const enter = (name) => {
    login({ name });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6"><Logo /></div>
      </header>
      <main className="mx-auto max-w-md px-4 py-14">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Вход в гараж</h1>
          <p className="mt-1 text-sm text-sub">Данные хранятся локально (localStorage) — демо без бэкенда.</p>

          <div className="mt-5 grid grid-cols-2 rounded-2xl border border-line bg-cardalt p-1">
            {[["sms", "SMS-код"], ["social", "Соцсети"]].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-xl py-2 text-sm font-medium transition-colors ${tab === t ? "bg-accent/15 text-ink" : "text-faint hover:text-sub"}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "sms" ? (
            <div className="mt-5 space-y-3">
              {!sent ? (
                <>
                  <input className="input font-mono" placeholder="+7 900 000-00-00" value={phone}
                    onChange={(e) => setPhone(e.target.value)} aria-label="Телефон" />
                  <button onClick={() => phone.replace(/\D/g, "").length >= 10 && setSent(true)} className="btn-cta w-full">
                    <MessageSquare size={16} /> Получить код
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-faint">Код отправлен на {phone} · демо: любой 4 цифры</p>
                  <input className="input font-mono text-center tracking-[0.5em]" maxLength={4} placeholder="••••"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-label="Код" />
                  <button disabled={code.length < 4} onClick={() => enter("Алекс")} className="btn-cta w-full disabled:opacity-40">
                    Войти
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {["Яндекс ID", "VK ID", "Google"].map((p) => (
                <button key={p} onClick={() => enter(`Владелец · ${p}`)} className="btn-ghost w-full justify-start gap-3">
                  <UserIcon size={15} className="text-glow" /> Продолжить через {p}
                </button>
              ))}
            </div>
          )}

          <p className="mt-5 text-center text-xs text-faint">
            Нет аккаунта? <Link to="/onboarding" className="text-glow hover:underline">Добавьте авто по VIN</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
