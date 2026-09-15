import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Archive, CalendarCheck, FolderKanban, Plus, RotateCcw, Zap } from "lucide-react";
import TaskEditor from "@/components/TaskEditor";
import TaskView from "@/components/TaskView";
import CompleteSheet from "@/components/CompleteSheet";
import BottomSheet from "@/components/BottomSheet";
import {
  emptyTask,
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

type Tab = "today" | "projects";

function Index() {
  const {
    projects,
    setProjects,
    tasks,
    setTasks,
    customTools,
    setCustomTools,
    customMaterials,
    setCustomMaterials,
    ready,
  } = useStore();
  const [tab, setTab] = React.useState<Tab>("today");
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [completing, setCompleting] = React.useState<Task | null>(null);
  const [showArchive, setShowArchive] = React.useState(false);
  const [newProject, setNewProject] = React.useState(false);
  const [sectionFor, setSectionFor] = React.useState<string | null>(null);
  const [nameInput, setNameInput] = React.useState("");

  const activeProject: Project | undefined =
    projects.find((p) => p.id === projectId) ?? projects[0];

  const visible = tasks.filter((t) => !t.done);
  const archived = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  const viewing = viewingId ? (tasks.find((t) => t.id === viewingId) ?? null) : null;
  const editingProject = editing ? projects.find((p) => p.id === editing.projectId) : undefined;

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "";
  const sectionName = (projectIdArg: string, id: string | null) =>
    projects.find((p) => p.id === projectIdArg)?.sections.find((s) => s.id === id)?.name ?? "";

  const updateTask = (task: Task) =>
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));

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
    setNameInput("");
    setNewProject(false);
  };

  const addSection = () => {
    const name = nameInput.trim();
    if (!name || !sectionFor) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === sectionFor ? { ...p, sections: [...p.sections, { id: uid(), name }] } : p)),
    );
    setNameInput("");
    setSectionFor(null);
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black uppercase tracking-tight text-foreground">
              {tab === "today" ? "Сегодня" : "Проекты"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {tab === "today"
                ? `${visible.length} активных · ${archived.length} в архиве`
                : `${projects.length} проектов`}
            </p>
          </div>
          {tab === "today" && (
            <button
              onClick={() => setShowArchive(true)}
              aria-label="Архив"
              className="shrink-0 rounded-xl border border-border p-2.5 text-muted-foreground"
            >
              <Archive className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {tab === "today" && (
        <section className="space-y-1.5 px-3 pt-3">
          {ready && visible.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Задач нет. Нажмите «плюс», чтобы добавить.
            </p>
          )}

          {visible.map((t) => {
            const p = qtyProgress(t);
            return (
              <button
                key={t.id}
                onClick={() => setViewingId(t.id)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-left"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                  <h2 className="truncate text-sm font-bold text-foreground">{t.title}</h2>
                  <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                    {t.qtyDone} / {t.qtyTarget} {t.qtyUnit}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
                </div>
              </button>
            );
          })}
        </section>
      )}

      {tab === "projects" && (
        <section className="space-y-2 px-3 pt-3">
          {projects.map((p) => {
            const count = tasks.filter((t) => t.projectId === p.id && !t.done).length;
            const current = activeProject?.id === p.id;
            return (
              <article key={p.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                <button
                  onClick={() => setProjectId(p.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left"
                >
                  <h2 className="truncate text-sm font-bold text-foreground">{p.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${current ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {current ? "текущий" : `${count} задач`}
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.sections.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setNameInput("");
                      setSectionFor(p.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-bold text-primary"
                  >
                    <Plus className="h-3 w-3" /> Секция
                  </button>
                </div>
              </article>
            );
          })}
          <button
            onClick={() => {
              setNameInput("");
              setNewProject(true);
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-3 text-sm font-bold text-primary"
          >
            <Plus className="h-4 w-4" /> Новый проект
          </button>
        </section>
      )}

      {tab === "today" && (
        <button
          onClick={() => {
            if (!activeProject) return;
            setIsNew(true);
            setEditing(emptyTask(activeProject.id, null));
          }}
          aria-label="Новая задача"
          className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2 border-t border-border bg-card/95 backdrop-blur">
        {(
          [
            { id: "today" as Tab, label: "Сегодня", Icon: CalendarCheck },
            { id: "projects" as Tab, label: "Проекты", Icon: FolderKanban },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 py-3 text-[11px] font-bold ${tab === id ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      {viewing && !editing && !completing && (
        <TaskView
          task={viewing}
          history={tasks}
          onChange={updateTask}
          onEdit={() => {
            setIsNew(false);
            setEditing(viewing);
          }}
          onDelete={() => {
            setTasks((prev) => prev.filter((t) => t.id !== viewing.id));
            setViewingId(null);
          }}
          onComplete={() => setCompleting({ ...viewing, qtyDone: viewing.qtyTarget })}
          onClose={() => setViewingId(null)}
        />
      )}

      {editing && (editingProject ?? activeProject) && (
        <TaskEditor
          task={editing}
          isNew={isNew}
          project={(editingProject ?? activeProject)!}
          history={tasks}
          customTools={customTools}
          customMaterials={customMaterials}
          onAddCustomTool={(name) => setCustomTools((prev) => [...prev, name])}
          onAddCustomMaterial={(name) => setCustomMaterials((prev) => [...prev, name])}
          onSave={saveTask}
          onDelete={
            isNew
              ? undefined
              : () => {
                  setTasks((prev) => prev.filter((t) => t.id !== editing.id));
                  setEditing(null);
                  setViewingId(null);
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
            updateTask(task);
            setCompleting(null);
            setViewingId(null);
          }}
          onClose={() => setCompleting(null)}
        />
      )}

      {(newProject || sectionFor) && (
        <BottomSheet
          title={newProject ? "Новый проект" : "Новая секция"}
          onClose={() => {
            setNewProject(false);
            setSectionFor(null);
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
                  {t.qtyDone} {t.qtyUnit} · {projectName(t.projectId)}
                  {t.sectionId ? ` · ${sectionName(t.projectId, t.sectionId)}` : ""}
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
