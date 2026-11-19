import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  /** "danger" gives the modal a tangerine edge and a slower, heavier entrance. */
  tone?: "default" | "danger";
}

export function Modal({ open, onClose, title, description, children, footer, size = "md", tone = "default" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const danger = tone === "danger";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: danger ? 0.45 : 0.2 }}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={danger ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] } : { type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col rounded-t-3xl border bg-surface shadow-2xl outline-none sm:rounded-3xl",
              danger ? "border-tangerine/60 shadow-[0_0_80px_-20px_rgba(255,138,31,0.5)]" : "border-white/[0.08] shadow-[0_30px_80px_-30px_rgba(43,91,255,0.45)]",
              size === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
            )}
          >
            {danger && <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-tangerine to-transparent" />}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-white/[0.05] hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
