import { useTranslation } from "@/i18n/useTranslation";

const GITHUB_HREF = "https://github.com/Maxim00191/wuwa-dango-race-sim";
const BILIBILI_HREF = "https://space.bilibili.com/32073947";

const linkClass =
  "inline-flex items-center gap-2 rounded-md text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-200";

const iconFrameClass =
  "inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-visible";

export function FooterSocialLinks() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      <a
        href={GITHUB_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <span className={iconFrameClass} aria-hidden>
          <GitHubIcon className="h-5 w-5 origin-center scale-[0.90]" />
        </span>
        <span className="text-sm font-medium tracking-tight">
          {t("footer.githubLabel")}
        </span>
      </a>
      <span
        className="hidden text-slate-400 sm:inline dark:text-slate-600"
        aria-hidden
      >
        ·
      </span>
      <a
        href={BILIBILI_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        <span className={iconFrameClass} aria-hidden>
          <BilibiliIcon className="h-5 w-5 origin-center scale-[1.14]" />
        </span>
        <span className="text-sm font-medium tracking-tight">
          {t("footer.bilibiliLabel")}
        </span>
      </a>
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function BilibiliIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3.75 6.5 5.75M16 3.75 17.5 5.75M6.2 6.5h11.6a1.45 1.45 0 0 1 1.45 1.45v9.1a1.45 1.45 0 0 1-1.45 1.45H6.2a1.45 1.45 0 0 1-1.45-1.45V7.95A1.45 1.45 0 0 1 6.2 6.5z"
      />
      <circle cx="9.35" cy="12.9" r="1.5" fill="currentColor" />
      <circle cx="14.65" cy="12.9" r="1.5" fill="currentColor" />
    </svg>
  );
}
