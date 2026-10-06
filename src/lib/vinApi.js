/**
 * Демо-«декодер» VIN. В продакшене заменяется на вызов
 * NHTSA vPIC / vindecoder.dev через серверный роут (см. README).
 * Любые 4+ символа дают результат — важно для UX онбординга.
 */
const DB = [
  {
    match: (vin) => /^(WVW|JT|XWE|Z8N)/i.test(vin) || /GOLF|VW/i.test(vin),
    car: {
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
      vinTail: "CW34567",
      mileage: 87400,
      fuelAvg: 8.9,
      tankSize: 50,
      nextServiceKm: 90000,
      serviceInterval: 15000,
      osagoExpiry: "2026-11-20",
      fines: [{ id: "8_f15203695810", date: "2026-09-14", amount: 500, place: "Москва, Ленинский пр., 39", status: "open" }],
      health: { engine: 82, brakes: 55, oil: 38 },
      recalls: [
        { code: "23V-456", name: "Отзывная кампания: программное обеспечение блока DSG", date: "2023-05-11" },
      ],
      commonIssues: [
        "Цепь ГРМ 2.0 TSI — растяжение к 90–120 тыс. км",
        "Течь помпы и термостата (пластиковый корпус)",
        "Износ кулачков распредвала (LA-серия моторов)",
      ],
    },
  },
  {
    match: (vin) => /^(JTM|JTH|2T|4T)/i.test(vin) || /RAV4|TOYOTA/i.test(vin),
    car: {
      brand: "Toyota",
      model: "RAV4",
      generation: "V (XA50)",
      year: 2021,
      trim: "2.5 Prestige 4WD AT",
      engine: "2.5 A25A-FKS · 199 л.с. · бензин",
      transmission: "Direct Shift-8AT",
      drive: "полный (AWD)",
      body: "кроссовер 5-дверный",
      color: "Cavalry Blue",
      plate: "Е 777 КХ 197",
      vinTail: "0142856",
      mileage: 61200,
      fuelAvg: 9.8,
      tankSize: 55,
      nextServiceKm: 70000,
      serviceInterval: 10000,
      osagoExpiry: "2027-02-04",
      fines: [],
      health: { engine: 93, brakes: 78, oil: 71 },
      recalls: [{ code: "22V-889", name: "Отзывная кампания: топливный насос низкого давления", date: "2022-09-02" }],
      commonIssues: ["Вибрация тормозов при перегреве", "Скрип передних стоек на морозе"],
    },
  },
  {
    match: (vin) => /^(WBA|WBS|4US|5UX)/i.test(vin) || /BMW|320|X5/i.test(vin),
    car: {
      brand: "BMW",
      model: "3 Series",
      generation: "G20",
      year: 2020,
      trim: "320i M Sport xDrive",
      engine: "2.0 B48B20 · 184 л.с. · бензин",
      transmission: "Steptronic-8 (ZF)",
      drive: "полный (xDrive)",
      body: "седан",
      color: "Portimao Blue",
      plate: "А 001 РР 799",
      vinTail: "K098765",
      mileage: 74800,
      fuelAvg: 9.2,
      tankSize: 59,
      nextServiceKm: 80000,
      serviceInterval: 10000,
      osagoExpiry: "2026-10-15",
      fines: [
        { id: "8_f55203695810", date: "2026-08-02", amount: 1500, place: "МКАД 41 км, датчик «Стрелка»", status: "open" },
        { id: "8_f15203695811", date: "2026-06-21", amount: 500, place: "Москва, Тверская ул.", status: "paid" },
      ],
      health: { engine: 74, brakes: 62, oil: 58 },
      recalls: [{ code: "21V-102", name: "Отзывная кампания: пиропатрон преднатяжителей ремней", date: "2021-03-19" }],
      commonIssues: ["Течь клапанной крышки и масляного поддона B48", "Износ VANOS-муфт", "Разрыв помпы (электронная)"],
    },
  },
];

const FALLBACK = {
  brand: "Kia",
  model: "Rio",
  generation: "IV (QB)",
  year: 2018,
  trim: "1.6 AT Luxe",
  engine: "1.6 G4FC · 123 л.с. · бензин",
  transmission: "АКПП-6",
  drive: "передний",
  body: "седан",
  color: "Clear White",
  plate: "Т 450 ЕЕ 77",
  vinTail: "R7712345",
  mileage: 112300,
  fuelAvg: 8.1,
  tankSize: 47,
  nextServiceKm: 115000,
  serviceInterval: 15000,
  osagoExpiry: "2026-12-01",
  fines: [],
  health: { engine: 66, brakes: 47, oil: 30 },
  recalls: [],
  commonIssues: ["Вибрация двигателя на холостых (подушки)", "Задиры в цилиндрах G4FC при редкой замене масла"],
};

export function decodeVin(input) {
  const q = (input || "").trim().toUpperCase();
  if (q.length < 4) return null;
  const hit = DB.find((d) => d.match(q));
  const base = hit ? hit.car : FALLBACK;
  // Уникальный хвост VIN из ввода, чтобы карточка выглядела «живой»
  const tail = q.replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(-7).padEnd(7, "0");
  return { ...base, vin: `${base.vinTail ? "" : ""}${tail}`, fullVin: `XTA${tail}` };
}
