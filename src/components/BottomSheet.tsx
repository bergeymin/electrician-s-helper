import * as React from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function BottomSheet({ title, onClose, action, children }: Props) {
  const [drag, setDrag] = React.useState(0);
  const startY = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = (e.touches[0]?.clientY ?? 0) - startY.current;
    setDrag(Math.max(0, dy));
  };
  const onTouchEnd = () => {
    startY.current = null;
    if (drag > 110) onClose();
    setDrag(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px]"
      />
      <div
        style={{ transform: `translateY(${drag}px)`, transition: drag ? "none" : "transform 0.2s" }}
        className="relative max-h-[88vh] w-full overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-2xl"
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="cursor-grab touch-none pt-2.5 pb-1"
        >
          <div className="flex justify-center">
            <span className="h-1.5 w-12 rounded-full bg-border" />
          </div>
          <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
            <button onClick={onClose} aria-label="Закрыть" className="shrink-0 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
            <h2 className="truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {title}
            </h2>
            <div className="shrink-0">{action}</div>
          </header>
        </div>
        <div className="max-h-[76vh] overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}
