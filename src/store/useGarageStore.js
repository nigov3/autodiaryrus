import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- Демо-данные для «пустого» гаража ---------- */
const seedCar = {
  id: uid(),
  vin: "XW8ZZZ17ZKW034567",
  brand: "Volkswagen",
  model: "Golf",
  generation: "VII (AH)",
  year: 2019,
  trim: "2.0 TSI DSG Comfortline",
  engine: "2.0 TSI · 180 л.с. · бензин",
  transmission: "DSG-7 (DQ381)",
  drive: "передний",
  body: "хэтчбек 5-дверный",
  color: "Deep Black",
  plate: "О 123 ВС 797",
  mileage: 87400,
  fuelAvg: 8.9,
  tankSize: 50,
  nextServiceKm: 90000,
  serviceInterval: 15000,
  osagoExpiry: "2026-11-20",
  fines: [
    { id: "f_" + uid(), date: "2026-09-14", amount: 500, place: "Москва, Ленинский пр., 39", status: "open" },
  ],
  health: { engine: 82, brakes: 55, oil: 38 },
  recalls: [{ code: "23V-456", name: "Отзывная кампания: ПО блока DSG", date: "2023-05-11" }],
  commonIssues: ["Цепь ГРМ — растяжение к 90–120 тыс. км", "Течь помпы и термостата"],
};

const seedExpenses = [
  { id: uid(), cat: "fuel", desc: "Лукойл АИ-95", amount: 2640, date: "2026-10-03", km: 86940, liters: 40, place: "Варшавское ш." },
  { id: uid(), cat: "carwash", desc: "Мойка самообслуживания", amount: 600, date: "2026-10-01", km: 86710 },
  { id: uid(), cat: "fuel", desc: "Газпром АИ-95", amount: 2490, date: "2026-09-27", km: 86350, liters: 38, place: "Каширское ш." },
  { id: uid(), cat: "parking", desc: "Парковка ТЦ «Мега»", amount: 800, date: "2026-09-25", km: 86210 },
  { id: uid(), cat: "maintenance", desc: "ТО-6: масло, фильтры, колодки", amount: 18900, date: "2026-09-18", km: 85900, place: "Автодом СЗАО" },
  { id: uid(), cat: "fuel", desc: "BP АИ-95", amount: 2710, date: "2026-09-12", km: 85320, liters: 41, place: "МКАД 32 км" },
  { id: uid(), cat: "tuning", desc: "Коврики EVA + сетка радиатора", amount: 3400, date: "2026-09-05", km: 85010 },
  { id: uid(), cat: "insurance", desc: "ОСАГО (электронный полис)", amount: 8740, date: "2026-08-28", km: 84650 },
  { id: uid(), cat: "repair", desc: "Замена ступичного подшипника", amount: 12300, date: "2026-08-15", km: 84100, place: "СТО «Гараж 54»" },
  { id: uid(), cat: "fuel", desc: "Лукойл АИ-95", amount: 2580, date: "2026-08-06", km: 83760, liters: 39, place: "Профсоюзная" },
  { id: uid(), cat: "tax", desc: "Транспортный налог 2025", amount: 5400, date: "2026-07-20", km: 83100 },
  { id: uid(), cat: "fuel", desc: "Татнефть АИ-95", amount: 2350, date: "2026-07-10", km: 82650, liters: 36, place: "Алтуфьево" },
  { id: uid(), cat: "repair", desc: "Диагностика подвески", amount: 3500, date: "2026-06-22", km: 82010 },
];

const seedHistory = [
  { id: uid(), date: "2026-09-18", title: "ТО-6: масло Engine Life 50ml, фильтры", cost: 18900, place: "Автодом СЗАО", cat: "maintenance" },
  { id: uid(), date: "2026-08-15", title: " Замена ступичного подшипника заднего правого", cost: 12300, place: "СТО «Гараж 54»", cat: "repair" },
  { id: uid(), date: "2026-02-11", title: "Сезонный шиномонтаж R17", cost: 3200, place: "ШинСервис", cat: "maintenance" },
  { id: uid(), date: "2025-11-20", title: "Покупка ОСАГО на год", cost: 8100, place: "Онлайн", cat: "insurance" },
];

export const useGarageStore = create(
  persist(
    (set, get) => ({
      user: null, // { name, phone }
      cars: [],
      activeCarId: null,
      expenses: {}, // carId -> []
      history: {}, // carId -> []

      /* ---------- онбординг / авто ---------- */
      addCarFromVin: (decoded) => {
        const car = { ...decoded, id: uid() };
        set((s) => ({
          cars: [...s.cars, car],
          activeCarId: car.id,
          expenses: { ...s.expenses, [car.id]: [] },
          history: { ...s.history, [car.id]: [] },
        }));
        return car.id;
      },
      removeCar: (id) =>
        set((s) => {
          const cars = s.cars.filter((c) => c.id !== id);
          return {
            cars,
            activeCarId: s.activeCarId === id ? cars[0]?.id ?? null : s.activeCarId,
          };
        }),
      setActiveCar: (id) => set({ activeCarId: id }),
      updateCarMileage: (id, mileage) =>
        set((s) => ({ cars: s.cars.map((c) => (c.id === id ? { ...c, mileage } : c)) })),
      login: ({ name }) => set({ user: { name } }),
      logout: () => set({ user: null }),

      /* ---------- расходы ---------- */
      addExpense: (carId, e) =>
        set((s) => {
          const list = [ { id: uid(), ...e }, ...(s.expenses[carId] || []) ];
          const car = s.cars.find((c) => c.id === carId);
          const cars = car && e.km ? s.cars.map((c) => (c.id === carId ? { ...c, mileage: Math.max(c.mileage, Number(e.km)) } : c)) : s.cars;
          return { expenses: { ...s.expenses, [carId]: list }, cars };
        }),
      removeExpense: (carId, expId) =>
        set((s) => ({
          expenses: { ...s.expenses, [carId]: (s.expenses[carId] || []).filter((e) => e.id !== expId) },
        })),

      /* ---------- штрафы ---------- */
      payFine: (carId, fineId) =>
        set((s) => ({
          cars: s.cars.map((c) =>
            c.id === carId
              ? { ...c, fines: (c.fines || []).map((f) => (f.id === fineId ? { ...f, status: "paid" } : f)) }
              : c
          ),
        })),

      selectors: {
        activeCar: () => {
          const s = get();
          return s.cars.find((c) => c.id === s.activeCarId) || null;
        },
      },
    }),
    {
      name: "garage-store",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (state) => {
        // Первая загрузка — наполняем демо-гараж
        if (!state.cars?.length) {
          state.cars = [seedCar];
          state.activeCarId = seedCar.id;
          state.expenses = { [seedCar.id]: seedExpenses };
          state.history = { [seedCar.id]: seedHistory };
        }
        return state;
      },
    }
  )
);

/** Загрузить демо-авто в пустой гараж (кнопка «посмотреть демо»). */
export const loadDemo = () =>
  useGarageStore.setState((s) => ({
    cars: s.cars.length ? s.cars : [seedCar],
    activeCarId: s.activeCarId ?? seedCar.id,
    expenses: s.expenses[seedCar.id] ? s.expenses : { ...s.expenses, [seedCar.id]: seedExpenses },
    history: s.history[seedCar.id] ? s.history : { ...s.history, [seedCar.id]: seedHistory },
  }));
