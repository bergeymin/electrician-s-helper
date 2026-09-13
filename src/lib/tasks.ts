import * as React from "react";

export type Priority = "low" | "normal" | "high";

export type Material = { id: string; name: string; qty: number; unit: string; used?: number };
export type Subtask = { id: string; title: string; done: boolean };
export type Section = { id: string; name: string };
export type Project = { id: string; name: string; sections: Section[] };

export type Task = {
  id: string;
  projectId: string;
  sectionId: string | null;
  title: string;
  due: string; // datetime-local value
  priority: Priority;
  qtyTarget: number;
  qtyUnit: string;
  qtyDone: number;
  tools: string[];
  materials: Material[];
  subtasks: Subtask[];
  done: boolean;
  completedAt: string | null;
  minutesSpent: number | null;
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Низкий",
  normal: "Обычный",
  high: "Срочно",
};

export const DEFAULT_TOOLS = [
  "Перфоратор",
  "Коронка 68 мм",
  "Лазерный уровень",
  "Стриппер",
  "Индикаторная отвертка",
  "Мультиметр",
  "Бокорезы",
  "Пресс-клещи НШВИ",
  "Штроборез",
  "Шуруповерт",
  "Набор отверток",
  "Протяжка (УЗК)",
  "Нож монтажный",
  "Уровень пузырьковый",
  "Термоусадочный фен",
];

export const UNITS = ["шт", "м", "уп", "кг", "компл", "точка"];

export const MATERIAL_SUGGESTIONS = [
  "Подрозетник",
  "Кабель ВВГ-Пнг 3х2.5",
  "Кабель ВВГ-Пнг 3х1.5",
  "Дюбель-хомут",
  "Клеммы WAGO 222",
  "Гофра ПВХ 20 мм",
  "Автомат 16А",
  "Распаячная коробка",
  "Изолента",
  "Гипс монтажный",
];

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyTask = (projectId: string, sectionId: string | null = null): Task => ({
  id: uid(),
  projectId,
  sectionId,
  title: "",
  due: "",
  priority: "normal",
  qtyTarget: 1,
  qtyUnit: "шт",
  qtyDone: 0,
  tools: [],
  materials: [],
  subtasks: [],
  done: false,
  completedAt: null,
  minutesSpent: null,
});

/* ---------- статистика по опыту ---------- */

const stem = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase().slice(0, 5);

const tokens = (title: string) =>
  new Set(
    title
      .split(/\s+/)
      .map(stem)
      .filter((w) => w.length >= 3),
  );

const similarity = (a: string, b: string) => {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter += 1;
  });
  return inter / new Set([...A, ...B]).size;
};

export type Estimate = {
  minutes: number;
  samples: number;
  perUnit: number;
  materials: Array<{ name: string; unit: string; perUnit: number }>;
};

/** Оценка времени и расхода материалов по завершённым похожим задачам. */
export function estimate(title: string, qty: number, history: Task[]): Estimate | null {
  const q = qty > 0 ? qty : 1;
  const similar = history.filter(
    (t) => t.done && t.minutesSpent && t.minutesSpent > 0 && similarity(t.title, title) >= 0.5,
  );
  if (!similar.length) return null;

  const perUnitValues = similar.map((t) => (t.minutesSpent ?? 0) / Math.max(1, t.qtyDone || t.qtyTarget));
  const perUnit = perUnitValues.reduce((a, b) => a + b, 0) / perUnitValues.length;

  const matMap = new Map<string, { name: string; unit: string; total: number; units: number }>();
  similar.forEach((t) => {
    const base = Math.max(1, t.qtyDone || t.qtyTarget);
    t.materials.forEach((m) => {
      const used = m.used ?? m.qty;
      if (!used) return;
      const key = m.name.toLowerCase();
      const cur = matMap.get(key) ?? { name: m.name, unit: m.unit, total: 0, units: 0 };
      cur.total += used;
      cur.units += base;
      matMap.set(key, cur);
    });
  });

  return {
    minutes: Math.round(perUnit * q),
    perUnit,
    samples: similar.length,
    materials: [...matMap.values()].map((m) => ({
      name: m.name,
      unit: m.unit,
      perUnit: m.total / m.units,
    })),
  };
}

export const fmtMinutes = (m: number) => {
  const total = Math.max(0, Math.round(m));
  const h = Math.floor(total / 60);
  const min = total % 60;
  if (h && min) return `${h} ч ${min} мин`;
  if (h) return `${h} ч`;
  return `${min} мин`;
};

export const fmtDue = (value: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const qtyProgress = (t: Task) =>
  t.qtyTarget > 0 ? Math.min(100, Math.round((t.qtyDone / t.qtyTarget) * 100)) : 0;

/* ---------- хранилище ---------- */

const TASKS_KEY = "electrician-tasks-v2";
const PROJECTS_KEY = "electrician-projects-v2";
const TOOLS_KEY = "electrician-tools-v1";

const seedProjectId = uid();
const seedFloor1 = uid();

const SEED_PROJECTS: Project[] = [
  { id: seedProjectId, name: "Офис", sections: [{ id: seedFloor1, name: "1 этаж" }] },
];

const SEED_TASKS: Task[] = [
  {
    id: uid(),
    projectId: seedProjectId,
    sectionId: seedFloor1,
    title: "Монтаж подрозетников",
    due: "",
    priority: "high",
    qtyTarget: 80,
    qtyUnit: "шт",
    qtyDone: 20,
    tools: ["Перфоратор", "Коронка 68 мм", "Лазерный уровень"],
    materials: [{ id: uid(), name: "Подрозетник", qty: 80, unit: "шт" }],
    subtasks: [
      { id: uid(), title: "Разметка по уровню", done: true },
      { id: uid(), title: "Высверлить коронкой", done: false },
    ],
    done: false,
    completedAt: null,
    minutesSpent: null,
  },
  {
    id: uid(),
    projectId: seedProjectId,
    sectionId: seedFloor1,
    title: "Монтаж подрозетников",
    due: "",
    priority: "normal",
    qtyTarget: 10,
    qtyUnit: "шт",
    qtyDone: 10,
    tools: ["Перфоратор", "Коронка 68 мм"],
    materials: [{ id: uid(), name: "Подрозетник", qty: 10, unit: "шт", used: 11 }],
    subtasks: [],
    done: true,
    completedAt: new Date().toISOString(),
    minutesSpent: 60,
  },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useStore() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [customTools, setCustomTools] = React.useState<string[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setProjects(read<Project[]>(PROJECTS_KEY, SEED_PROJECTS));
    setTasks(read<Task[]>(TASKS_KEY, SEED_TASKS));
    setCustomTools(read<string[]>(TOOLS_KEY, []));
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (ready) localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects, ready]);
  React.useEffect(() => {
    if (ready) localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);
  React.useEffect(() => {
    if (ready) localStorage.setItem(TOOLS_KEY, JSON.stringify(customTools));
  }, [customTools, ready]);

  return { projects, setProjects, tasks, setTasks, customTools, setCustomTools, ready };
}
