import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PlaybackSettingsProvider } from "@/hooks/PlaybackSettingsProvider";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container missing");
}

createRoot(container).render(
  <StrictMode>
    <LanguageProvider>
      <PlaybackSettingsProvider>
        <App />
      </PlaybackSettingsProvider>
    </LanguageProvider>
  </StrictMode>
);
