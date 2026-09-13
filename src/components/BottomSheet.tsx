import * as React from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function BottomSheet({ title, onClose, action, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"
      />
      <div className="relative max-h-[86vh] w-full overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl">
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-12 rounded-full bg-border" />
        </div>
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <button onClick={onClose} aria-label="Закрыть" className="shrink-0 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
          <h2 className="truncate text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
          <div className="shrink-0">{action}</div>
        </header>
        <div className="max-h-[74vh] overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}
