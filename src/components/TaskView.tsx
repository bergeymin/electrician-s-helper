import * as React from "react";
import { Calendar, Check, CheckCircle2, Clock, MoreVertical, Package, Trash2, Wrench } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  estimate,
  fmtDue,
  fmtMinutes,
  qtyProgress,
  type Task,
} from "@/lib/tasks";

type Props = {
  task: Task;
  history: Task[];
  onChange: (task: Task) => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onClose: () => void;
};

const label = "text-[11px] font-bold uppercase tracking-wider text-muted-foreground";

export default function TaskView({
  task,
  history,
  onChange,
  onEdit,
  onDelete,
  onComplete,
  onClose,
}: Props) {
  const [menu, setMenu] = React.useState(false);
  const [qtyText, setQtyText] = React.useState(String(task.qtyDone));

  React.useEffect(() => setQtyText(String(task.qtyDone)), [task.qtyDone]);

  const max = Math.max(1, task.qtyTarget);
  const clamp = (n: number) => Math.min(max, Math.max(0, n));
  const setQty = (n: number) => onChange({ ...task, qtyDone: clamp(n) });
  const est = estimate(task.title, task.qtyTarget, history);
  const percent = qtyProgress(task);

  return (
    <BottomSheet
      title="Задача"
      onClose={onClose}
      action={
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Действия"
            className="rounded-lg border border-border p-2 text-muted-foreground"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-11 z-10 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              <button
                onClick={() => {
                  setMenu(false);
                  onEdit();
                }}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-foreground"
              >
                Изменить
              </button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <h3 className="text-base font-black leading-snug text-foreground">{task.title}</h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${PRIORITY_BADGE[task.priority]}`}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.due && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {fmtDue(task.due)}
            </span>
          )}
          {task.doneDate && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {fmtDue(task.doneDate)}
            </span>
          )}
          {est && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              <Clock className="h-3 w-3" />≈ {fmtMinutes(est.minutes)}
            </span>
          )}
        </div>

        <section className="rounded-xl border border-border bg-background px-3 py-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <input
              type="range"
              min={0}
              max={max}
              value={clamp(task.qtyDone)}
              onChange={(e) => setQty(Number(e.target.value))}
              aria-label="Прогресс"
              className="w-full accent-primary"
            />
            <div className="flex shrink-0 items-baseline gap-1">
              <input
                value={qtyText}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setQtyText(raw);
                  setQty(Number(raw) || 0);
                }}
                inputMode="numeric"
                aria-label="Выполненное количество"
                className="w-12 rounded-lg border border-input bg-card px-1 py-1 text-center text-sm font-bold text-foreground outline-none focus:border-primary"
              />
              <span className="text-[11px] font-semibold text-muted-foreground">
                / {task.qtyTarget} {task.qtyUnit} · {percent}%
              </span>
            </div>
          </div>
        </section>

        {task.tools.length > 0 && (
          <section className="space-y-1.5">
            <p className={`${label} inline-flex items-center gap-1.5`}>
              <Wrench className="h-3 w-3" /> Инструмент
            </p>
            <div className="flex flex-wrap gap-1.5">
              {task.tools.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {task.materials.length > 0 && (
          <section className="space-y-1.5">
            <p className={`${label} inline-flex items-center gap-1.5`}>
              <Package className="h-3 w-3" /> Материалы
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
              {task.materials.map((m) => (
                <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2">
                  <span className="truncate text-sm text-foreground">{m.name}</span>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {m.qty} {m.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {task.subtasks.length > 0 && (
          <section className="space-y-1.5">
            <p className={label}>
              Чеклист {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </p>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background">
              {task.subtasks.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 px-3 py-2"
                >
                  <button
                    onClick={() =>
                      onChange({
                        ...task,
                        subtasks: task.subtasks.map((x) =>
                          x.id === s.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                    aria-label="Отметить"
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${s.done ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                  >
                    {s.done && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <span
                    className={`truncate text-sm ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {s.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 pt-1">
          <button
            onClick={onDelete}
            aria-label="Удалить задачу"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-destructive/40 text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={onComplete}
            className="h-12 w-full rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/25"
          >
            Завершить задачу
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
