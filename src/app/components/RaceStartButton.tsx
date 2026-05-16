import type { MouseEvent } from "react";

export type RaceStartButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant?: "primary" | "final";
};

const PRIMARY_CLASS =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

const FINAL_CLASS =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400";

export function RaceStartButton({
  label,
  disabled,
  onClick,
  variant = "primary",
}: RaceStartButtonProps) {
  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={onClick}
      disabled={disabled}
      className={variant === "final" ? FINAL_CLASS : PRIMARY_CLASS}
    >
      {label}
    </button>
  );
}
