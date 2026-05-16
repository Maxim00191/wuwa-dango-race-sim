import type { Root } from "react-dom/client";
import {
  createApplicationTree,
  type CreateApplicationTreeOptions,
} from "@/bootstrap/createApplicationTree";
import {
  mountApplication,
  type MountApplicationOptions,
} from "@/bootstrap/mountApplication";

export type BootstrapApplicationOptions = {
  tree?: CreateApplicationTreeOptions;
  mount?: Omit<MountApplicationOptions, "appTree">;
};

export function bootstrapApplication(
  options: BootstrapApplicationOptions = {}
): Root {
  const appTree = createApplicationTree(options.tree);
  return mountApplication({ ...options.mount, appTree });
}
