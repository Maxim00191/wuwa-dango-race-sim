import { useCallback, useState } from "react";

const STORAGE_KEY = "dango-scramble-color-mode";

export function useTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  const applyDark = useCallback((nextDark: boolean) => {
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    setIsDark(nextDark);
  }, []);

  const toggle = useCallback(() => {
    applyDark(!document.documentElement.classList.contains("dark"));
  }, [applyDark]);

  return { isDark, toggle, applyDark };
}
