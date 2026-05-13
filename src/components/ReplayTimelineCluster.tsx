import { useRef, type MouseEvent } from "react";

export type ReplayFileToolbarProps = {
  /** When true, omit the top divider and inline heading (parent supplies a section title). */
  panelMode?: boolean;
  seekControlsVisible: boolean;
  canCopyJson: boolean;
  seekTurnDraft: string;
  onSeekTurnDraftChange: (value: string) => void;
  onSeekTurnSubmit: () => void;
  onExportCopy: () => void;
  onImportFile: (payload: string) => void;
  jumpToPresentVisible: boolean;
  onJumpToPresent: () => void;
  labels: {
    toolbarCaption: string;
    seekTurnLabel: string;
    seekTurnButton: string;
    exportCopy: string;
    import: string;
    idleHint: string;
    jumpToPresent: string;
  };
};

function suppressMouseDownFocus(e: MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}

export function ReplayFileToolbar(props: ReplayFileToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    panelMode = true,
    seekControlsVisible,
    canCopyJson,
    seekTurnDraft,
    onSeekTurnDraftChange,
    onSeekTurnSubmit,
    onExportCopy,
    onImportFile,
    jumpToPresentVisible,
    onJumpToPresent,
    labels,
  } = props;

  return (
    <div
      className={
        panelMode
          ? "flex w-full flex-col gap-2"
          : "flex w-full flex-col gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/80"
      }
    >
      {panelMode ? null : (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {labels.toolbarCaption}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {jumpToPresentVisible ? (
          <button
            type="button"
            onMouseDown={suppressMouseDownFocus}
            onClick={onJumpToPresent}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-50 shadow-md shadow-emerald-950/30 transition hover:bg-emerald-500 sm:min-h-10 sm:px-4 sm:text-sm"
          >
            {labels.jumpToPresent}
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onMouseDown={suppressMouseDownFocus}
              onClick={onExportCopy}
              disabled={!canCopyJson}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-md shadow-slate-950/30 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-10 sm:px-4 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {labels.exportCopy}
            </button>
            <button
              type="button"
              onMouseDown={suppressMouseDownFocus}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-md shadow-slate-950/30 transition hover:bg-slate-500 sm:min-h-10 sm:px-4 sm:text-sm"
            >
              {labels.import}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) {
                  return;
                }
                void file.text().then(onImportFile);
              }}
            />
          </div>
          <p className="max-w-[20rem] text-end text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {labels.idleHint}
          </p>
        </div>
        {seekControlsVisible ? (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {labels.seekTurnLabel}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={seekTurnDraft}
              onChange={(event) => onSeekTurnDraftChange(event.target.value)}
              placeholder="0"
              className="min-h-9 w-16 rounded-full border border-slate-300 bg-white px-2 text-center text-xs font-semibold text-slate-900 shadow-inner shadow-slate-900/5 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
            />
            <button
              type="button"
              onMouseDown={suppressMouseDownFocus}
              onClick={onSeekTurnSubmit}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-md shadow-amber-900/25 transition hover:bg-amber-400 sm:min-h-10 sm:px-4 sm:text-sm"
            >
              {labels.seekTurnButton}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type ReplayTimelineClusterProps = ReplayFileToolbarProps;
export const ReplayTimelineCluster = ReplayFileToolbar;
