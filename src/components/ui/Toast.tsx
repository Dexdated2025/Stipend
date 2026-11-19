import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleCheck, CircleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "warning" | "info";
interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastApi {
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastApi["toast"]>(
    ({ title, description, tone = "success" }) => {
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs.slice(-3), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface p-3.5 shadow-xl animate-fade-up",
              t.tone === "warning" ? "border-tangerine/40" : t.tone === "info" ? "border-electric/40" : "border-success/30",
            )}
          >
            {t.tone === "warning" ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-tangerine" />
            ) : (
              <CircleCheck className={cn("mt-0.5 h-4 w-4 shrink-0", t.tone === "info" ? "text-electric-400" : "text-success")} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-fg" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
