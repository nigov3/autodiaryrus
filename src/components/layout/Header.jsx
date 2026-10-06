import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import {
  Warehouse,
  Plus,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ReceiptText,
  Cog,
  User,
  Home,
  X,
} from "lucide-react";
import { useGarageStore } from "../../store/useGarageStore";
import { useActiveCar } from "../../hooks/useStats";
import { useOpen, closeAllUI } from "../../lib/uiRegistry";

const NAV = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/dashboard", label: "Гараж", icon: LayoutDashboard },
  { to: "/expenses", label: "Расходы", icon: ReceiptText },
  { to: "/parts", label: "Запчасти", icon: Cog },
  { to: "/profile", label: "Профиль", icon: User },
];

export function Logo({ small = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="GARAGE — на главную">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cta shadow-glow">
        <Warehouse size={small ? 16 : 18} strokeWidth={2} className="text-white" />
      </span>
      <span className="font-display text-lg font-semibold tracking-wide">
        GARAGE<span className="text-glow">.</span>
      </span>
    </Link>
  );
}

/** Переключатель автомобилей (dropdown). */
function CarSwitcher() {
  const [open, setOpen] = useOpen("car-switch");
  const { car, cars } = useActiveCar();
  const setActiveCar = useGarageStore((s) => s.setActiveCar);

  if (!car) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost !py-2 max-w-[220px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_8px_#00D68F] shrink-0" />
        <span className="truncate text-ink font-medium">
          {car.brand} {car.model}
        </span>
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-64 card p-1.5"
            role="listbox"
          >
            {cars.map((c) => (
              <li key={c.id}>
                <button
                  role="option"
                  aria-selected={c.id === car.id}
                  onClick={() => {
                    setActiveCar(c.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-cardalt ${
                    c.id === car.id ? "text-ink bg-cardalt" : "text-sub"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{c.brand} {c.model}</span>
                    <span className="block font-mono text-xs text-faint">{c.plate}</span>
                  </span>
                  {c.id === car.id && <span className="h-2 w-2 rounded-full bg-glow" />}
                </button>
              </li>
            ))}
            <li>
              <Link
                to="/onboarding"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-glow hover:bg-cardalt"
              >
                <Plus size={15} /> Добавить автомобиль
              </Link>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ publicPage = false }) {
  const navigate = useNavigate();
  const user = useGarageStore((s) => s.user);
  const logout = useGarageStore((s) => s.logout);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        {!publicPage && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Основная навигация">
            {NAV.slice(1, 4).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-cardalt text-ink" : "text-sub hover:text-ink"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          {!publicPage && <CarSwitcher />}
          {publicPage ? (
            <>
              <Link to="/onboarding" className="btn-cta !py-2.5 text-sm hidden sm:inline-flex">
                Проверить авто
              </Link>
              <Link to="/dashboard" className="btn-ghost">
                Войти
              </Link>
            </>
          ) : user ? (
            <button
              className="btn-ghost"
              onClick={() => {
                logout();
                navigate("/");
              }}
              aria-label="Выйти"
            >
              <LogOut size={15} /> <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <Link to="/login" className="btn-cta !py-2.5 text-sm">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/** Нижняя мобильная навигация + FAB. */
export function BottomNav() {
  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-base/85 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]"
        aria-label="Мобильная навигация"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                    isActive ? "text-glow" : "text-faint"
                  }`
                }
              >
                <n.icon size={19} strokeWidth={1.8} />
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <NavLink
        to="/expenses?add=1"
        className={({ isActive }) =>
          `fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-cta text-white shadow-lg shadow-glow transition-all md:hidden ${
            isActive ? "scale-95" : "hover:scale-105 active:scale-95"
          }`
        }
        aria-label="Добавить расход"
      >
        <Plus size={24} strokeWidth={2.2} />
      </NavLink>
    </>
  );
}

export function AppShell({ children }) {
  // закрытие dropdown/модалок при смене маршрута
  const location = useLocation();
  useEffect(() => {
    closeAllUI();
  }, [location.pathname]);

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}

export function PageTitle({ title, sub, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl sm:text-[32px] font-semibold leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export { X };
