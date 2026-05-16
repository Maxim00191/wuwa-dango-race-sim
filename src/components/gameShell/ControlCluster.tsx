import type { ReactNode } from "react";

type ControlClusterProps = {
  label: string;
  children: ReactNode;
};

export function ControlCluster({ label, children }: ControlClusterProps) {
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-slate-950/25">
      <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {label}
      </p>
      {children}
    </section>
  );
}
