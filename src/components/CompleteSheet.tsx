import * as React from "react";
import BottomSheet from "@/components/BottomSheet";
import { estimate, fmtMinutes, type Task } from "@/lib/tasks";

type Props = {
  task: Task;
  history: Task[];
  onComplete: (task: Task) => void;
  onClose: () => void;
};

const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary";

export default function CompleteSheet({ task, history, onComplete, onClose }: Props) {
  const [hours, setHours] = React.useState("");
  const [used, setUsed] = React.useState<Record<string, string>>(
    Object.fromEntries(task.materials.map((m) => [m.id, String(m.used ?? m.qty)])),
  );

  const est = estimate(task.title, task.qtyTarget, history);
  const totalMinutes = Math.round((Number(hours.replace(",", ".")) || 0) * 60);

  const finish = () => {
    if (totalMinutes <= 0) return;
    onComplete({
      ...task,
      done: true,
      completedAt: new Date().toISOString(),
      minutesSpent: totalMinutes,
      qtyDone: task.qtyTarget,
      materials: task.materials.map((m) => ({
        ...m,
        used: Number((used[m.id] ?? "").replace(",", ".")) || m.qty,
      })),
    });
  };

  return (
    <BottomSheet
      title="Завершение задачи"
      onClose={onClose}
      action={
        <button
          onClick={finish}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
          disabled={totalMinutes <= 0}
        >
          В архив
        </button>
      }
    >
      <div className="space-y-5 pt-1">
        <p className="text-sm font-bold text-foreground">{task.title}</p>
        <p className="text-xs text-muted-foreground">
          Выполнено будет записано как {task.qtyTarget} {task.qtyUnit}.
        </p>

        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Затраченное время, часы
          </p>
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
            placeholder="например 2,5"
            className={field}
          />
          {est && (
            <p className="text-xs text-muted-foreground">Прогноз по опыту был {fmtMinutes(est.minutes)}</p>
          )}
        </section>

        {task.materials.length > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Фактический расход материалов
            </p>
            {task.materials.map((m) => (
              <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_96px_auto] items-center gap-2">
                <span className="truncate text-sm text-foreground">{m.name}</span>
                <input
                  value={used[m.id] ?? ""}
                  onChange={(e) => setUsed((p) => ({ ...p, [m.id]: e.target.value }))}
                  inputMode="decimal"
                  aria-label={`Расход: ${m.name}`}
                  className={`${field} py-2.5`}
                />
                <span className="text-xs text-muted-foreground">{m.unit}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </BottomSheet>
  );
}
