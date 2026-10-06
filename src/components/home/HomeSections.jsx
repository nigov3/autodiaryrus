import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Cog, ReceiptText, Disc3, Wrench, ShieldCheck, Users, ArrowUpRight } from "lucide-react";

const SERVICES = [
  { to: "/parts", name: "Запчасти", desc: "Подбор строго по VIN: оригинал, аналоги и б/у в одной карточке.", icon: Cog, tone: "#00D6FF" },
  { to: "/expenses", name: "Дневник расходов", desc: "Стоимость 1 км, категории, графики — всё как в Stripe.", icon: ReceiptText, tone: "#00D68F" },
  { to: "/soon/wheels", name: "Колёса и шины", desc: "Подбор по размеру авто и примерка дисков онлайн.", icon: Disc3, tone: "#FFB800" },
  { to: "/soon/repair", name: "Ремонт и ТО", desc: "Карта СТО рядом, калькулятор ТО, онлайн-запись.", icon: Wrench, tone: "#FF3B5C" },
  { to: "/soon/insurance", name: "Страхование", desc: "Калькулятор ОСАГО/КАСКО и покупка полиса в 1 клик.", icon: ShieldCheck, tone: "#8B5CF6" },
  { to: "/soon/community", name: "Сообщество", desc: "Бортжурналы и форум владельцев вашей модели.", icon: Users, tone: "#FF6B35" },
];

const STEPS = [
  { n: "01", t: "Введите VIN", d: "Сканируем автомобиль, собираем данные о модели, годе и комплектации." },
  { n: "02", t: "Получите инсайты", d: "Типичные проблемы, отзывные кампании и прогноз расходов — ещё до регистрации." },
  { n: "03", t: "Управляйте гаражом", d: "Все сервисы работают в контексте вашего авто: запчасти, расходы, ТО, штрафы." },
];

export default function HomeSections() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14" aria-labelledby="services-title">
        <div className="mb-8 flex items-end justify-between">
          <h2 id="services-title" className="font-display text-[26px] sm:text-[32px] font-semibold">
            Сервисы гаража
          </h2>
          <span className="hidden sm:block font-mono text-xs text-faint">6 MODULES · VIN-AWARE</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link to={s.to} className="card card-hover group block h-full p-5">
                <div className="flex items-start justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-cardalt transition-colors group-hover:border-transparent"
                    style={{ color: s.tone }}
                  >
                    <s.icon size={20} strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight size={17} className="text-faint transition-colors group-hover:text-glow" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold">{s.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-sub">{s.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16" aria-labelledby="how-title">
        <h2 id="how-title" className="font-display text-[26px] sm:text-[32px] font-semibold mb-8">
          Как это работает
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((st, i) => (
            <motion.div
              key={st.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="card relative overflow-hidden p-6"
            >
              <span className="absolute -right-3 -top-4 font-display text-[72px] font-bold leading-none text-accent/[0.08]">
                {st.n}
              </span>
              <span className="font-mono text-xs text-glow">STEP {st.n}</span>
              <h3 className="mt-2 text-lg font-semibold">{st.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sub">{st.d}</p>
              {i < 2 && <div className="absolute bottom-5 right-5 hidden md:block text-faint">→</div>}
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-display text-ink">GARAGE.</span> © 2026 — персональный хаб автовладельца.
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link className="hover:text-glow transition-colors" to="/parts">Запчасти</Link>
          <Link className="hover:text-glow transition-colors" to="/expenses">Расходы</Link>
          <Link className="hover:text-glow transition-colors" to="/onboarding">Проверить VIN</Link>
          <a className="hover:text-glow transition-colors" href="#" onClick={(e) => e.preventDefault()}>Политика</a>
        </nav>
      </div>
    </footer>
  );
}
