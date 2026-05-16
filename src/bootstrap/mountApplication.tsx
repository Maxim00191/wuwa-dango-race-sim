import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ROOT_CONTAINER_ID } from "@/config/bootstrap";

export type MountApplicationOptions = {
  appTree: ReactNode;
  containerId?: string;
  resolveContainer?: (elementId: string) => HTMLElement | null;
  createDomRoot?: (container: HTMLElement) => Root;
};

function defaultResolveContainer(elementId: string): HTMLElement | null {
  return document.getElementById(elementId);
}

export function mountApplication({
  appTree,
  containerId = ROOT_CONTAINER_ID,
  resolveContainer = defaultResolveContainer,
  createDomRoot = createRoot,
}: MountApplicationOptions): Root {
  const container = resolveContainer(containerId);

  if (!container) {
    throw new Error(`Root container #${containerId} missing`);
  }

  const root = createDomRoot(container);
  root.render(appTree);
  return root;
}
