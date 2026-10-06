import { useEffect, useState } from "react";

/**
 * Простейший глобальный реестр открытых UI-слоёв (dropdown/модалки).
 * При смене маршрута всё закрывается — не нужно пробрасывать пропсы.
 */
const openSet = new Set();
const listeners = new Set();

const emit = () => listeners.forEach((l) => l());

export function closeAllUI() {
  if (openSet.size === 0) return;
  openSet.clear();
  emit();
}

export function useOpen(key) {
  const [open, setOpenState] = useState(false);

  useEffect(() => {
    const sync = () => setOpenState(openSet.has(key));
    sync();
    listeners.add(sync);
    return () => listeners.delete(sync);
  }, [key]);

  const setOpen = (v) => {
    const next = typeof v === "function" ? v(openSet.has(key)) : v;
    if (next) openSet.add(key);
    else openSet.delete(key);
    emit();
  };

  return [open, setOpen];
}
