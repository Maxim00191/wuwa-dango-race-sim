export class MonteCarloCancelledError extends Error {
  constructor() {
    super("Monte Carlo run cancelled");
    this.name = "MonteCarloCancelledError";
  }
}

export function hasAbortBeenRequested(
  signal: AbortSignal | undefined,
  shouldAbort: (() => boolean) | undefined
): boolean {
  return Boolean(signal?.aborted || shouldAbort?.());
}

export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    globalThis.setTimeout(resolve, 0);
  });
}
