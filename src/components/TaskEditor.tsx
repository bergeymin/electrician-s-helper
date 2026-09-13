import * as React from "react";
import { Check, Clock, Plus, Trash2 } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import {
  DEFAULT_TOOLS,
  MATERIAL_SUGGESTIONS,
  PRIORITY_LABEL,
  UNITS,
  estimate,
  fmtMinutes,
  uid,
  type Priority,
  type Project,
  type Task,
} from "@/lib/tasks";

type Props = {
  task: Task;
  isNew: boolean;
  project: Project;
  history: Task[];
  customTools: string[];
  onAddCustomTool: (name: string) => void;
  onSave: (task: Task) => void;
  onDelete?: (() => void) | undefined;
  onClose: () => void;
};

const chip = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";
const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary";
const label = "text-xs font-bold uppercase tracking-wider text-muted-foreground";

export default function TaskEditor({
  task,
  isNew,
  project,
  history,
  customTools,
  onAddCustomTool,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [draft, setDraft] = React.useState<Task>(task);
  const [toolInput, setToolInput] = React.useState("");
  const [matName, setMatName] = React.useState("");
  const [matQty, setMatQty] = React.useState("");
  const [matUnit, setMatUnit] = React.useState("шт");
  const [subInput, setSubInput] = React.useState("");

  const set = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const allTools = [...DEFAULT_TOOLS, ...customTools];
  const est = estimate(draft.title, draft.qtyTarget, history);

  const toggleTool = (name: string) =>
    set("tools", draft.tools.includes(name) ? draft.tools.filter((t) => t !== name) : [...draft.tools, name]);

  const addCustomTool = () => {
    const name = toolInput.trim();
    if (!name) return;
    if (!allTools.includes(name)) onAddCustomTool(name);
    if (!draft.tools.includes(name)) set("tools", [...draft.tools, name]);
    setToolInput("");
  };

  const addMaterial = () => {
    if (!matName.trim()) return;
    set("materials", [
      ...draft.materials,
      { id: uid(), name: matName.trim(), qty: Number(matQty.replace(",", ".")) || 1, unit: matUnit },
    ]);
    setMatName("");
    setMatQty("");
  };

  const addSub = () => {
    if (!subInput.trim()) return;
    set("subtasks", [...draft.subtasks, { id: uid(), title: subInput.trim(), done: false }]);
    setSubInput("");
  };

  return (
    <BottomSheet
      title={isNew ? "Новая задача" : "Задача"}
      onClose={onClose}
      action={
        <button
          onClick={() => draft.title.trim() && onSave(draft)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          Сохранить
        </button>
      }
    >
      <div className="space-y-6 pt-1">
        <input
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Что нужно сделать?"
          className={`${field} text-base font-semibold`}
        />

        {est && (
          <div className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 text-xs text-foreground">
              <p className="font-bold text-primary">Ориентировочно {fmtMinutes(est.minutes)}</p>
              <p className="mt-0.5 text-muted-foreground">
                По опыту: {fmtMinutes(est.perUnit)} на 1 {draft.qtyUnit} · похожих задач: {est.samples}
              </p>
              {est.materials.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  Расход:{" "}
                  {est.materials
                    .map(
                      (m) =>
                        `${m.name} ≈ ${(m.perUnit * Math.max(1, draft.qtyTarget)).toFixed(1)} ${m.unit}`,
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        <section className="space-y-2">
          <p className={label}>Количество</p>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              value={draft.qtyTarget}
              onChange={(e) => set("qtyTarget", Number(e.target.value.replace(/\D/g, "")) || 0)}
              inputMode="numeric"
              placeholder="80"
              className={field}
            />
            <select
              value={draft.qtyUnit}
              onChange={(e) => set("qtyUnit", e.target.value)}
              className="shrink-0 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Выполнено</span>
              <span className="text-primary">
                {draft.qtyDone} / {draft.qtyTarget} {draft.qtyUnit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, draft.qtyTarget)}
              value={Math.min(draft.qtyDone, Math.max(1, draft.qtyTarget))}
              onChange={(e) => set("qtyDone", Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className={label}>Секция проекта «{project.name}»</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => set("sectionId", null)}
              className={`${chip} ${draft.sectionId === null ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted-foreground"}`}
            >
              Без секции
            </button>
            {project.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => set("sectionId", s.id)}
                className={`${chip} ${draft.sectionId === s.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted-foreground"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>

        <label className="block space-y-1.5">
          <span className={label}>Срок</span>
          <input
            type="datetime-local"
            value={draft.due}
            onChange={(e) => set("due", e.target.value)}
            className={field}
          />
        </label>

        <section className="space-y-2">
          <p className={label}>Приоритет</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => set("priority", p)}
                className={`${chip} ${draft.priority === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className={label}>Инструмент ({draft.tools.length})</p>
          <div className="flex flex-wrap gap-2">
            {allTools.map((t) => {
              const on = draft.tools.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTool(t)}
                  className={`${chip} inline-flex items-center gap-1 ${on ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-muted-foreground"}`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {t}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              placeholder="Свой инструмент"
              className={`${field} min-w-0 flex-1 py-2.5`}
            />
            <button
              onClick={addCustomTool}
              className="shrink-0 rounded-xl border border-border px-3 text-primary"
              aria-label="Добавить инструмент"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <p className={label}>Материалы (план)</p>
          <ul className="space-y-2">
            {draft.materials.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="truncate text-sm text-foreground">{m.name}</span>
                <span className="shrink-0 text-sm font-bold text-primary">
                  {m.qty} {m.unit}
                </span>
                <button
                  onClick={() => set("materials", draft.materials.filter((x) => x.id !== m.id))}
                  aria-label="Удалить материал"
                  className="shrink-0 text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
            <input
              list="material-suggestions"
              value={matName}
              onChange={(e) => setMatName(e.target.value)}
              placeholder="Материал"
              className={`${field} py-2.5`}
            />
            <datalist id="material-suggestions">
              {MATERIAL_SUGGESTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
              <input
                value={matQty}
                onChange={(e) => setMatQty(e.target.value)}
                inputMode="decimal"
                placeholder="Кол-во"
                className={`${field} min-w-0 py-2.5`}
              />
              <select
                value={matUnit}
                onChange={(e) => setMatUnit(e.target.value)}
                className="shrink-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <button
                onClick={addMaterial}
                className="shrink-0 rounded-lg bg-primary px-3 text-primary-foreground"
                aria-label="Добавить материал"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <p className={label}>Подзадачи (не влияют на прогресс)</p>
          <ul className="space-y-2">
            {draft.subtasks.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <button
                  onClick={() =>
                    set(
                      "subtasks",
                      draft.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                    )
                  }
                  aria-label="Отметить"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${s.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {s.done && <Check className="h-4 w-4" />}
                </button>
                <span
                  className={`truncate text-sm ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {s.title}
                </span>
                <button
                  onClick={() => set("subtasks", draft.subtasks.filter((x) => x.id !== s.id))}
                  aria-label="Удалить подзадачу"
                  className="shrink-0 text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
              placeholder="Шаг работы"
              className={`${field} min-w-0 flex-1 py-2.5`}
            />
            <button
              onClick={addSub}
              className="shrink-0 rounded-xl border border-border px-3 text-primary"
              aria-label="Добавить подзадачу"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full rounded-xl border border-destructive/40 py-3 text-sm font-bold text-destructive"
          >
            Удалить задачу
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
