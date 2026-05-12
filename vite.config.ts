import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const buildTimestamp = new Date().toISOString();

function manualChunks(id: string) {
  const normalizedId = id.split(path.sep).join("/");

  if (normalizedId.includes("/node_modules/")) {
    if (
      normalizedId.includes("/node_modules/react/") ||
      normalizedId.includes("/node_modules/react-dom/") ||
      normalizedId.includes("/node_modules/scheduler/")
    ) {
      return "react-vendor";
    }

    return "vendor";
  }
}

export default defineConfig({
  base: "/",
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
    },
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks,
      },
    },
  },
});
