import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HomeSections, { Footer } from "../components/home/HomeSections.jsx";
import VinScanAnimation from "../components/home/VinScanAnimation.jsx";
import VinTizer from "../components/home/VinTizer.jsx";
import { Logo } from "../components/layout/Header.jsx";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* публичный header */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-sub" aria-label="Публичная навигация">
            <a href="#services" className="hover:text-ink transition-colors">Сервисы</a>
            <a href="#how" className="hover:text-ink transition-colors">Как это работает</a>
          </nav>
          <Link to="/dashboard" className="btn-ghost">
            Войти в гараж
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* ambient glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
        <div className="pointer-events-none absolute top-24 right-[8%] h-56 w-56 rounded-full bg-glow/10 blur-[100px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 pt-14 pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="chip cursor-default mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_8px_#00D68F]" />
              VIN-AWARE ПЛАТФОРМА · v1.0
            </span>
            <h1 className="font-display text-[34px] leading-[1.12] font-bold sm:text-[48px]">
              Один гараж —<br />
              <span className="bg-gradient-to-r from-accent to-glow bg-clip-text text-transparent">
                весь ваш автомобиль
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-sub">
              Добавьте авто по VIN — и сервисы подстроятся под вашу машину: запчасти по факту сборки,
              дневник расходов с ценой километра, штрафы, страховка и сообщество владельцев.
            </p>
            <div className="mt-6">
              <VinTizer />
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-faint">
              <span>▸ 1 200+ моделей в базе</span>
              <span>▸ Данные ГИБДД и отзывных кампаний</span>
              <span>▸ Бесплатный VIN-тизер</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="card relative p-6 animate-floaty">
              <VinScanAnimation />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ["ЗДОРОВЬЕ", "82%", "text-ok"],
                  ["ТО ПРОЙДЕНО", "6/8", "text-glow"],
                  ["ШТРАФЫ", "1", "text-warn"],
                ].map(([k, v, c]) => (
                  <div key={k} className="rounded-xl border border-line bg-cardalt p-3">
                    <div className={`font-mono text-lg font-bold ${c}`}>{v}</div>
                    <div className="mt-0.5 text-[10px] tracking-wider text-faint">{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div id="services" className="scroll-mt-20">
        <div id="how" className="scroll-mt-20">
          <HomeSections />
        </div>
      </div>

      <Footer />
    </div>
  );
}
