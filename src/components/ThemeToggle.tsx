import { useTranslation } from "@/i18n/useTranslation";

type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  const { t } = useTranslation();
  const currentThemeLabel = isDark
    ? t("theme.darkShortLabel")
    : t("theme.lightShortLabel");

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        isDark ? t("theme.switchToLightAria") : t("theme.switchToDarkAria")
      }
      title={isDark ? t("theme.lightTitle") : t("theme.darkTitle")}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2 shadow-sm shadow-slate-900/10 transition sm:h-10 sm:gap-2 sm:px-2.5 sm:pr-3.5 sm:shadow-md ${
        isDark
          ? "border-indigo-400/60 bg-slate-900/95 text-slate-50 hover:border-indigo-300 hover:bg-slate-800 dark:shadow-slate-950/60"
          : "border-amber-300/80 bg-white/95 text-slate-900 hover:border-amber-400 hover:bg-amber-50"
      }`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7 ${
          isDark
            ? "bg-indigo-400/20 text-amber-300"
            : "bg-amber-100 text-amber-600"
        }`}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className="hidden text-xs font-semibold tracking-tight sm:inline sm:text-sm">
        {currentThemeLabel}
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-[1.125rem] w-[1.125rem]"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-[1.25rem] w-[1.25rem]"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}
