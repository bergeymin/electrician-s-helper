import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Archive, Calendar, Clock, Package, Plus, RotateCcw, Wrench, Zap } from "lucide-react";
import TaskEditor from "@/components/TaskEditor";
import CompleteSheet from "@/components/CompleteSheet";
import BottomSheet from "@/components/BottomSheet";
import {
  PRIORITY_LABEL,
  emptyTask,
  estimate,
  fmtDue,
  fmtMinutes,
  qtyProgress,
  uid,
  useStore,
  type Project,
  type Task,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Планировщик задач электромонтажника" },
      {
        name: "description",
        content:
          "Проекты и секции, задачи с количеством, учёт времени по опыту, расход материалов и архив завершённых работ.",
      },
      { property: "og:title", content: "Планировщик задач электромонтажника" },
      {
        property: "og:description",
        content: "Проекты, секции, количество, прогноз времени по прошлым задачам и расход материалов.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { projects, setProjects, tasks, setTasks, customTools, setCustomTools, ready } = useStore();
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [completing, setCompleting] = React.useState<Task | null>(null);
  const [showArchive, setShowArchive] = React.useState(false);
  const [newProject, setNewProject] = React.useState(false);
  const [newSection, setNewSection] = React.useState(false);
  const [nameInput, setNameInput] = React.useState("");

  const activeProject: Project | undefined =
    projects.find((p) => p.id === projectId) ?? projects[0];

  const projectTasks = tasks.filter((t) => t.projectId === activeProject?.id);
  const visible = projectTasks.filter(
    (t) => !t.done && (sectionFilter === "all" || (t.sectionId ?? "none") === sectionFilter),
  );
  const archived = projectTasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  const sectionName = (id: string | null) =>
    activeProject?.sections.find((s) => s.id === id)?.name ?? "";

  const saveTask = (task: Task) => {
    setTasks((prev) =>
      prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev],
    );
    setEditing(null);
  };

  const addProject = () => {
    const name = nameInput.trim();
    if (!name) return;
    const p: Project = { id: uid(), name, sections: [] };
    setProjects((prev) => [...prev, p]);
    setProjectId(p.id);
    setSectionFilter("all");
    setNameInput("");
    setNewProject(false);
  };

  const addSection = () => {
    const name = nameInput.trim();
    if (!name || !activeProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id ? { ...p, sections: [...p.sections, { id: uid(), name }] } : p,
      ),
    );
    setNameInput("");
    setNewSection(false);
  };

  const setQtyDone = (id: string, value: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, qtyDone: value } : t)));

  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 pt-5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black uppercase tracking-tight text-foreground">
              {activeProject?.name ?? "Планировщик"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {visible.length} активных · {archived.length} в архиве
            </p>
          </div>
          <button
            onClick={() => setShowArchive(true)}
            aria-label="Архив"
            className="shrink-0 rounded-xl border border-border p-2.5 text-muted-foreground"
          >
            <Archive className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProjectId(p.id);
                setSectionFilter("all");
              }}
              className={`max-w-[55vw] shrink-0 truncate rounded-full px-4 py-2 text-xs font-bold ${
                activeProject?.id === p.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => {
              setNameInput("");
              setNewProject(true);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-2 text-xs font-bold text-primary"
          >
            <Plus className="h-4 w-4" /> Проект
          </button>
        </div>

        {activeProject && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            <button
              onClick={() => setSectionFilter("all")}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                sectionFilter === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              Все секции
            </button>
            {activeProject.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionFilter(s.id)}
                className={`max-w-[50vw] shrink-0 truncate rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                  sectionFilter === s.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
            <button
              onClick={() => {
                setNameInput("");
                setNewSection(true);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Секция
            </button>
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
          const p = qtyProgress(t);
          const est = estimate(t.title, t.qtyTarget, tasks);
          return (
            <article key={t.id} className="rounded-2xl border border-border bg-card p-4">
              <div
                onClick={() => {
                  setIsNew(false);
                  setEditing(t);
                }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <h2 className="min-w-0 text-base font-bold leading-snug text-foreground">{t.title}</h2>
                  {t.priority === "high" && (
                    <span className="shrink-0 rounded-full bg-destructive/20 px-2.5 py-1 text-[11px] font-bold text-destructive">
                      {PRIORITY_LABEL.high}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                  {t.sectionId && <span className="truncate">{sectionName(t.sectionId)}</span>}
                  {t.due && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {fmtDue(t.due)}
                    </span>
                  )}
                  {est && (
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <Clock className="h-3.5 w-3.5 shrink-0" />≈ {fmtMinutes(est.minutes)}
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
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>
                    Прогресс {t.qtyDone} / {t.qtyTarget} {t.qtyUnit}
                  </span>
                  <span>{p}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, t.qtyTarget)}
                  value={Math.min(t.qtyDone, Math.max(1, t.qtyTarget))}
                  onChange={(e) => setQtyDone(t.id, Number(e.target.value))}
                  aria-label="Выполненное количество"
                  className="mt-2 w-full accent-primary"
                />
              </div>

              {t.subtasks.length > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Подзадачи {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}
                </p>
              )}

              <button
                onClick={() => setCompleting(t)}
                className="mt-3 w-full rounded-xl border border-primary/50 bg-primary/10 py-2.5 text-xs font-bold text-primary"
              >
                Завершить и записать время
              </button>
            </article>
          );
        })}
      </section>

      <button
        onClick={() => {
          if (!activeProject) return;
          setIsNew(true);
          setEditing(
            emptyTask(activeProject.id, sectionFilter === "all" ? null : sectionFilter),
          );
        }}
        aria-label="Новая задача"
        className="fixed bottom-6 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
      >
        <Plus className="h-7 w-7" />
      </button>

      {editing && activeProject && (
        <TaskEditor
          task={editing}
          isNew={isNew}
          project={activeProject}
          history={tasks}
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

      {completing && (
        <CompleteSheet
          task={completing}
          history={tasks}
          onComplete={(task) => {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
            setCompleting(null);
          }}
          onClose={() => setCompleting(null)}
        />
      )}

      {(newProject || newSection) && (
        <BottomSheet
          title={newProject ? "Новый проект" : "Новая секция"}
          onClose={() => {
            setNewProject(false);
            setNewSection(false);
          }}
          action={
            <button
              onClick={newProject ? addProject : addSection}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              Добавить
            </button>
          }
        >
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={newProject ? "Например: Офис" : "Например: 1 этаж"}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </BottomSheet>
      )}

      {showArchive && (
        <BottomSheet title="Архив завершённых" onClose={() => setShowArchive(false)}>
          <div className="space-y-3 pt-1">
            {archived.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Пока пусто.</p>
            )}
            {archived.map((t) => (
              <article key={t.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <h3 className="min-w-0 text-sm font-bold text-foreground">{t.title}</h3>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {fmtMinutes(t.minutesSpent ?? 0)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t.qtyDone} {t.qtyUnit}
                  {t.sectionId ? ` · ${sectionName(t.sectionId)}` : ""}
                  {t.completedAt ? ` · ${new Date(t.completedAt).toLocaleDateString("ru-RU")}` : ""}
                </p>
                {t.materials.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    {t.materials.map((m) => (
                      <li key={m.id}>
                        {m.name}: израсходовано {m.used ?? m.qty} {m.unit}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() =>
                    setTasks((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, done: false, completedAt: null } : x)),
                    )
                  }
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Вернуть в работу
                </button>
              </article>
            ))}
          </div>
        </BottomSheet>
      )}
    </main>
  );
}
