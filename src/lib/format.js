export const rub = (n) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n || 0)) + " ₽";

export const num = (n, d = 1) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(n || 0);

export const dateRu = (iso) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export const dateFullRu = (iso) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0);

export const groupBy = (arr, f) =>
  arr.reduce((acc, item) => {
    const k = f(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
