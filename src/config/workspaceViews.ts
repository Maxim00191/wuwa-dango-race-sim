export const WORKSPACE_VIEWS = [
  "normal",
  "tournament",
  "knockout",
  "analysis",
] as const;

export type WorkspaceView = (typeof WORKSPACE_VIEWS)[number];

export type SimulationWorkspaceView = Exclude<WorkspaceView, "analysis">;

export const SIMULATION_WORKSPACE_VIEWS = WORKSPACE_VIEWS.filter(
  (view): view is SimulationWorkspaceView => view !== "analysis"
);

export type WorkspaceNavItemConfig = {
  id: WorkspaceView;
  labelKey:
    | "nav.views.normal"
    | "nav.views.tournament"
    | "nav.views.knockout"
    | "nav.views.analysis";
  activeClassName: string;
};

export const WORKSPACE_NAV_ACTIVE_CLASSNAMES: Record<WorkspaceView, string> = {
  normal:
    "bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-900/30 sm:shadow-lg",
  tournament:
    "bg-violet-500 text-violet-950 shadow-md shadow-violet-900/30 sm:shadow-lg",
  knockout:
    "bg-amber-500 text-amber-950 shadow-md shadow-amber-900/30 sm:shadow-lg",
  analysis: "bg-sky-500 text-slate-950 shadow-md shadow-sky-900/30 sm:shadow-lg",
};

export const WORKSPACE_NAV_ITEMS: readonly WorkspaceNavItemConfig[] = [
  {
    id: "normal",
    labelKey: "nav.views.normal",
    activeClassName: WORKSPACE_NAV_ACTIVE_CLASSNAMES.normal,
  },
  {
    id: "tournament",
    labelKey: "nav.views.tournament",
    activeClassName: WORKSPACE_NAV_ACTIVE_CLASSNAMES.tournament,
  },
  {
    id: "knockout",
    labelKey: "nav.views.knockout",
    activeClassName: WORKSPACE_NAV_ACTIVE_CLASSNAMES.knockout,
  },
  {
    id: "analysis",
    labelKey: "nav.views.analysis",
    activeClassName: WORKSPACE_NAV_ACTIVE_CLASSNAMES.analysis,
  },
];

export const WORKSPACE_NAV_INACTIVE_CLASSNAME =
  "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";

export const WORKSPACE_NAV_BUTTON_CLASSNAME =
  "min-h-9 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-tight transition sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm";
