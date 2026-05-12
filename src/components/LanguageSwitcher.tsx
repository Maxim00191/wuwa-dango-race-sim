import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { AppLanguage } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";

const LANGUAGE_OPTIONS: { value: AppLanguage; labelKey: string }[] = [
  { value: "zh-CN", labelKey: "locale.zh-CN" },
  { value: "en", labelKey: "locale.en" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();
  const listboxId = useId();
  const activeOption = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((option) => option.value === language) ??
      LANGUAGE_OPTIONS[0],
    [language]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const selectLanguage = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 pl-2 pr-2 shadow-md shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/50"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100/90 text-slate-500 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:text-slate-400 dark:ring-slate-800">
        <GlobeIcon />
      </span>
      <label
        htmlFor={buttonId}
        className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:block"
      >
        {t("nav.language.label")}
      </label>
      <div className="relative">
        <button
          id={buttonId}
          type="button"
          aria-label={t("nav.language.label")}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onClick={() => setIsOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
          className={`inline-flex h-9 min-w-[7.5rem] items-center justify-between gap-3 rounded-full border px-4 text-sm font-semibold shadow-inner shadow-slate-900/5 outline-none transition ${
            isOpen
              ? "border-violet-400 bg-white text-slate-900 ring-2 ring-violet-400/60 ring-offset-2 ring-offset-white dark:border-violet-500 dark:bg-slate-950 dark:text-slate-50 dark:ring-offset-slate-900"
              : "border-slate-200/80 bg-slate-100/90 text-slate-800 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-slate-950/20 dark:hover:border-slate-700 dark:hover:bg-slate-950"
          }`}
        >
          <span className="truncate">{t(activeOption.labelKey)}</span>
          <span
            className={`text-slate-400 transition dark:text-slate-500 ${isOpen ? "rotate-180" : ""}`}
          >
            <ChevronDownIcon />
          </span>
        </button>
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-[13rem] origin-top-right transition ${
            isOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-[0_22px_60px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-950/95 dark:shadow-[0_24px_70px_-20px_rgba(2,6,23,0.8)]">
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={buttonId}
              className="grid gap-1"
            >
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = option.value === language;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectLanguage(option.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-violet-50 text-violet-950 shadow-sm shadow-violet-900/10 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-100 dark:ring-violet-800"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{t(option.labelKey)}</span>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        selected
                          ? "bg-violet-500 text-violet-950 dark:bg-violet-400 dark:text-violet-950"
                          : "text-transparent"
                      }`}
                    >
                      <CheckIcon />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-[1.05rem] w-[1.05rem]"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-8.5 9h17"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25L12 15.75 4.5 8.25"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}
