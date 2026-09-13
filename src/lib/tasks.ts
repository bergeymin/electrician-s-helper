import * as React from "react";

export type Status = "todo" | "doing" | "done";
export type Priority = "low" | "normal" | "high";

export type Material = { id: string; name: string; qty: string; unit: string };
export type Subtask = { id: string; title: string; done: boolean };

export type Task = {
  id: string;
  title: string;
  status: Status;
  due: string;
  priority: Priority;
  site: string;
  room: string;
  tools: string[];
  materials: Material[];
  subtasks: Subtask[];
};

export const STATUS_LABEL: Record<Status, string> = {
  todo: "К выполнению",
  doing: "В работе",
  done: "Готово",
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

export const UNITS = ["шт", "м", "уп", "кг", "компл"];

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

export const emptyTask = (): Task => ({
  id: uid(),
  title: "",
  status: "todo",
  due: "",
  priority: "normal",
  site: "",
  room: "",
  tools: [],
  materials: [],
  subtasks: [],
});

const KEY = "electrician-tasks-v1";
const TOOLS_KEY = "electrician-tools-v1";

const SEED: Task[] = [
  {
    id: uid(),
    title: "Монтаж подрозетников в гостиной",
    status: "doing",
    due: "",
    priority: "high",
    site: "ЖК Восточный, кв. 42",
    room: "Гостиная",
    tools: ["Перфоратор", "Коронка 68 мм", "Лазерный уровень"],
    materials: [
      { id: uid(), name: "Подрозетник", qty: "12", unit: "шт" },
      { id: uid(), name: "Гипс монтажный", qty: "5", unit: "кг" },
    ],
    subtasks: [
      { id: uid(), title: "Разметка по уровню", done: true },
      { id: uid(), title: "Высверлить коронкой", done: true },
      { id: uid(), title: "Посадить на гипс", done: false },
    ],
  },
  {
    id: uid(),
    title: "Протяжка кабеля к щиту",
    status: "todo",
    due: "",
    priority: "normal",
    site: "ЖК Восточный, кв. 42",
    room: "Коридор",
    tools: ["Протяжка (УЗК)", "Стриппер", "Мультиметр"],
    materials: [{ id: uid(), name: "Кабель ВВГ-Пнг 3х2.5", qty: "40", unit: "м" }],
    subtasks: [{ id: uid(), title: "Проверить трассу", done: false }],
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

export function useTasks() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [customTools, setCustomTools] = React.useState<string[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setTasks(read<Task[]>(KEY, SEED));
    setCustomTools(read<string[]>(TOOLS_KEY, []));
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  React.useEffect(() => {
    if (ready) localStorage.setItem(TOOLS_KEY, JSON.stringify(customTools));
  }, [customTools, ready]);

  return { tasks, setTasks, customTools, setCustomTools, ready };
}

export const progress = (t: Task) =>
  t.subtasks.length ? Math.round((t.subtasks.filter((s) => s.done).length / t.subtasks.length) * 100) : 0;
