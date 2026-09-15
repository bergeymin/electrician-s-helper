import * as React from "react";
import { dayOffset, fmtDue, toDateOnly } from "@/lib/tasks";

type Props = { value: string; onChange: (value: string) => void };

const chip = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";

const QUICK: Array<{ label: string; offset: number }> = [
  { label: "Сегодня", offset: 0 },
  { label: "Завтра", offset: 1 },
  { label: "Послезавтра", offset: 2 },
];

export default function DuePicker({ value, onChange }: Props) {
  const current = toDateOnly(value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => {
          const date = dayOffset(q.offset);
          const on = current === date;
          return (
            <button
              key={q.label}
              onClick={() => onChange(on ? "" : date)}
              className={`${chip} ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
            >
              {q.label}
            </button>
          );
        })}
        {current && (
          <button
            onClick={() => onChange("")}
            className={`${chip} border-border bg-background text-muted-foreground`}
          >
            Без срока
          </button>
        )}
      </div>
      <input
        type="date"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Дата срока"
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
      {current && <p className="text-xs text-muted-foreground">Срок: {fmtDue(current)}</p>}
    </div>
  );
}
