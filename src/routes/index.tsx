import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin, Plus, Wrench, Package, Zap } from "lucide-react";
import TaskEditor from "@/components/TaskEditor";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  emptyTask,
  progress,
  useTasks,
  type Status,
  type Task,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Планировщик задач электромонтажника" },
      {
        name: "description",
        content:
          "Мобильный планировщик для электрика: задачи, инструмент, материалы, чеклист подзадач и объекты.",
      },
      { property: "og:title", content: "Планировщик задач электромонтажника" },
      {
        property: "og:description",
        content: "Задачи, инструмент, материалы и чеклист работ — в одном мобильном приложении.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FILTERS: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "Все" },
  { key: "todo", label: STATUS_LABEL.todo },
  { key: "doing", label: STATUS_LABEL.doing },
  { key: "done", label: STATUS_LABEL.done },
];

function Index() {
  const { tasks, setTasks, customTools, setCustomTools, ready } = useTasks();
  const [filter, setFilter] = React.useState<"all" | Status>("all");
  const [site, setSite] = React.useState("all");
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [isNew, setIsNew] = React.useState(false);

  const sites = Array.from(new Set(tasks.map((t) => t.site).filter(Boolean)));

  const visible = tasks.filter(
    (t) => (filter === "all" || t.status === filter) && (site === "all" || t.site === site),
  );

  const saveTask = (task: Task) => {
    setTasks((prev) =>
      prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev],
    );
    setEditing(null);
  };

  const cycleStatus = (t: Task) => {
    const order: Status[] = ["todo", "doing", "done"];
    const next = order[(order.indexOf(t.status) + 1) % 3];
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x)));
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 pt-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black uppercase tracking-tight text-foreground">
              Наряд-задачи
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {tasks.filter((t) => t.status !== "done").length} в работе ·{" "}
              {tasks.filter((t) => t.status === "done").length} готово
            </p>
          </div>
        </div>

        <div className="-mx-0 mt-4 flex gap-2 overflow-x-auto px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {sites.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            <button
              onClick={() => setSite("all")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                site === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              Все объекты
            </button>
            {sites.map((s) => (
              <button
                key={s}
                onClick={() => setSite(s)}
                className={`max-w-[60vw] shrink-0 truncate rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                  site === s ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="space-y-3 px-4 pt-4">
        {ready && visible.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Задач нет. Нажмите «плюс», чтобы добавить.
          </p>
        )}

        {visible.map((t) => {
          const p = progress(t);
          return (
            <article
              key={t.id}
              onClick={() => {
                setIsNew(false);
                setEditing(t);
              }}
              className="rounded-2xl border border-border bg-card p-4 active:scale-[0.99]"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <h2 className="min-w-0 text-base font-bold leading-snug text-foreground">{t.title}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleStatus(t);
                  }}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                    t.status === "done"
                      ? "bg-primary/20 text-primary"
                      : t.status === "doing"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[t.status]}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                {(t.site || t.room) && (
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{[t.site, t.room].filter(Boolean).join(" · ")}</span>
                  </span>
                )}
                {t.due && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {t.due}
                  </span>
                )}
                {t.tools.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5 shrink-0" />
                    {t.tools.length}
                  </span>
                )}
                {t.materials.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    {t.materials.length}
                  </span>
                )}
                {t.priority === "high" && (
                  <span className="font-bold text-destructive">{PRIORITY_LABEL.high}</span>
                )}
              </div>

              {t.subtasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>
                      Подзадачи {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}
                    </span>
                    <span>{p}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <button
        onClick={() => {
          setIsNew(true);
          setEditing(emptyTask());
        }}
        aria-label="Новая задача"
        className="fixed bottom-6 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
      >
        <Plus className="h-7 w-7" />
      </button>

      {editing && (
        <TaskEditor
          task={editing}
          customTools={customTools}
          onAddCustomTool={(name) => setCustomTools((prev) => [...prev, name])}
          onSave={saveTask}
          onDelete={
            isNew
              ? undefined
              : () => {
                  setTasks((prev) => prev.filter((t) => t.id !== editing.id));
                  setEditing(null);
                }
          }
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
