import { useTranslation } from "@/i18n/useTranslation";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-md shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-slate-950/50">
      <label
        htmlFor="language-switcher"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
      >
        {t("nav.language.label")}
      </label>
      <select
        id="language-switcher"
        value={language}
        onChange={(event) => setLanguage(event.target.value as "en" | "zh-CN")}
        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        aria-label={t("nav.language.label")}
      >
        <option value="en">{t("locale.en")}</option>
        <option value="zh-CN">{t("locale.zh-CN")}</option>
      </select>
    </div>
  );
}
