import {
  Fuel,
  Wrench,
  CalendarClock,
  ShieldCheck,
  Landmark,
  Droplets,
  SquareParking,
  Sparkles,
} from "lucide-react";

/** Единый справочник категорий расходов (расширяемый). */
export const CATEGORIES = [
  { id: "fuel", name: "Топливо", color: "#FF6B35", icon: Fuel },
  { id: "maintenance", name: "ТО", color: "#00D68F", icon: CalendarClock },
  { id: "repair", name: "Ремонт", color: "#FF3B5C", icon: Wrench },
  { id: "insurance", name: "Страховка", color: "#8B5CF6", icon: ShieldCheck },
  { id: "tax", name: "Налог", color: "#0066FF", icon: Landmark },
  { id: "carwash", name: "Мойка", color: "#00D6FF", icon: Droplets },
  { id: "parking", name: "Парковка", color: "#FFB800", icon: SquareParking },
  { id: "tuning", name: "Тюнинг", color: "#F472B6", icon: Sparkles },
];

export const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

export const HEALTH_LABELS = { engine: "Двигатель", brakes: "Тормоза", oil: "Масло" };

export const healthColor = (v) => (v >= 70 ? "#00D68F" : v >= 40 ? "#FFB800" : "#FF3B5C");
