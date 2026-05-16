export type LoggedErrorContext = Record<string, unknown>;

export function logApplicationError(
  error: unknown,
  context?: LoggedErrorContext
): void {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  };
  console.error("[application-error]", payload);
}
