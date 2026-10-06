import { useMemo } from "react";
import { useGarageStore } from "../store/useGarageStore";
import { CATEGORIES, catById } from "../lib/categories";
import { MONTHS_SHORT, sum } from "../lib/format";

/** Активное авто + его расходы. */
export function useActiveCar() {
  const cars = useGarageStore((s) => s.cars);
  const activeCarId = useGarageStore((s) => s.activeCarId);
  const expenses = useGarageStore((s) => s.expenses);
  const history = useGarageStore((s) => s.history);
  const car = useMemo(() => cars.find((c) => c.id === activeCarId) || null, [cars, activeCarId]);
  return {
    car,
    cars,
    expenses: (car && expenses[car.id]) || [],
    history: (car && history[car.id]) || [],
  };
}

const inPeriod = (e, start, end) => {
  const d = new Date(e.date);
  return d >= start && d < end;
};

/** Полная аналитика дневника расходов для активного авто. */
export function useExpensesStats() {
  const { car, expenses } = useActiveCar();

  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const yStart = new Date(year, 0, 1);
    const yEnd = new Date(year + 1, 0, 1);
    const mStart = new Date(year, now.getMonth(), 1);
    const mEnd = new Date(year, now.getMonth() + 1, 1);
    const pMStart = new Date(year, now.getMonth() - 1, 1);

    const yearList = expenses.filter((e) => inPeriod(e, yStart, yEnd));
    const monthList = expenses.filter((e) => inPeriod(e, mStart, mEnd));
    const prevMonthList = expenses.filter((e) => inPeriod(e, pMStart, mStart));

    const yearTotal = sum(yearList, (e) => e.amount);
    const monthTotal = sum(monthList, (e) => e.amount);
    const prevMonthTotal = sum(prevMonthList, (e) => e.amount);
    const monthDelta = prevMonthTotal ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null;

    // Стоимость 1 км: годовой расход / годовой пробег
    const kms = yearList.filter((e) => e.km).map((e) => Number(e.km));
    let kmDriven = 0;
    if (kms.length > 1) kmDriven = Math.max(...kms) - Math.min(...kms);
    else if (car?.mileage) kmDriven = Math.min(car.mileage, 15000); // оценка за год
    const costPerKm = kmDriven > 200 ? yearTotal / kmDriven : null;

    // Средний расход топлива л/100км по заправкам
    const fuel = yearList.filter((e) => e.cat === "fuel" && e.liters && e.km);
    let fuelAvg = null;
    if (fuel.length >= 2) {
      const sorted = [...fuel].sort((a, b) => a.km - b.km);
      let liters = 0,
        dist = 0;
      for (let i = 1; i < sorted.length; i++) {
        const d = sorted[i].km - sorted[i - 1].km;
        if (d > 0 && d < 1200) {
          liters += Number(sorted[i].liters);
          dist += d;
        }
      }
      if (dist > 0) fuelAvg = (liters / dist) * 100;
    }
    if (fuelAvg == null) fuelAvg = car?.fuelAvg ?? null;

    // По категориям (за год)
    const byCat = CATEGORIES.map((c) => ({
      ...c,
      total: sum(yearList.filter((e) => e.cat === c.id), (e) => e.amount),
    })).filter((c) => c.total > 0);

    // Помесячно (последние 6 месяцев года)
    const byMonth = [];
    for (let m = 0; m <= now.getMonth(); m++) {
      const ms = new Date(year, m, 1);
      const me = new Date(year, m + 1, 1);
      byMonth.push({
        month: MONTHS_SHORT[m],
        value: sum(expenses.filter((e) => inPeriod(e, ms, me)), (e) => e.amount),
      });
    }

    return {
      yearTotal,
      monthTotal,
      monthDelta,
      costPerKm,
      fuelAvg,
      kmDriven,
      byCat,
      byMonth,
      avgMonth: yearTotal / (now.getMonth() + 1),
    };
  }, [expenses, car]);
}

export { catById };
