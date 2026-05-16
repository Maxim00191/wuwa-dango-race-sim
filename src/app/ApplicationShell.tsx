import type { ReactNode } from "react";
import { AppNavigation } from "@/components/AppNavigation";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import {
  useApplicationActions,
  useApplicationTheme,
  useNavigationWorkspace,
} from "@/app/contexts/workspaceContexts";
import { useTranslation } from "@/i18n/useTranslation";

export type ApplicationShellProps = {
  children: ReactNode;
};

export function ApplicationShell({ children }: ApplicationShellProps) {
  const { t } = useTranslation();
  const navigation = useNavigationWorkspace();
  const theme = useApplicationTheme();
  const { formattedBuildTimestamp } = useApplicationActions();

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavigation
        activeView={navigation.workspaceView}
        onSelectView={navigation.setWorkspaceView}
        isDarkTheme={theme.isDark}
        onToggleTheme={theme.toggle}
      />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="mt-auto border-t border-slate-200/70 px-4 py-6 text-center text-xs text-slate-500/80 dark:border-slate-800/70 dark:text-slate-400/80 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 leading-6">
          <p>{t("footer.disclaimer")}</p>
          <FooterSocialLinks />
          <p>
            Build time:{" "}
            <time dateTime={__BUILD_TIMESTAMP__}>{formattedBuildTimestamp}</time>
          </p>
        </div>
      </footer>
    </div>
  );
}
