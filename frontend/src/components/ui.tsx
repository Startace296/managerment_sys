import { type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { EmployeeStatus, Pagination } from "../lib/types";
import { STATUS_LABEL } from "../lib/types";

/* ---------- Button ---------- */
export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-petrol text-white hover:bg-petrol-deep disabled:bg-ink-soft/40",
    ghost:
      "bg-transparent text-ink border border-line hover:border-petrol hover:text-petrol",
    danger: "bg-danger/10 text-danger hover:bg-danger hover:text-white",
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ---------- Form field ---------- */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-petrol focus:ring-2 focus:ring-petrol-soft transition";

/* ---------- Modal ---------- */
export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className={`relative w-full ${
              wide ? "max-w-2xl" : "max-w-md"
            } rounded-2xl bg-surface p-6 shadow-2xl`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-ink-soft transition hover:bg-mist hover:text-ink"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Status badge ---------- */
export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const map: Record<EmployeeStatus, string> = {
    active: "bg-ok/10 text-ok",
    on_leave: "bg-signal/15 text-[#9a6a17]",
    inactive: "bg-ink-soft/10 text-ink-soft",
  };
  const dot: Record<EmployeeStatus, string> = {
    active: "bg-ok",
    on_leave: "bg-signal",
    inactive: "bg-ink-soft",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ---------- Pagination ---------- */
export function Paginator({
  pagination,
  onPage,
}: {
  pagination: Pagination;
  onPage: (p: number) => void;
}) {
  const { page, totalPages, total } = pagination;
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-ink-soft">
      <span>
        Page <b className="text-ink">{page}</b> / {totalPages} ·{" "}
        <span className="font-mono">{total}</span> records
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ← Previous
        </Button>
        <Button
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}

/* ---------- Empty & loading ---------- */
export function EmptyState({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-dashed border-line py-14 text-center text-sm text-ink-soft"
    >
      {text}
    </motion.div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="size-7 rounded-full border-2 border-petrol-soft border-t-petrol"
      />
    </div>
  );
}
