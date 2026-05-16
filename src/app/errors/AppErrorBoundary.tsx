import { Component, type ErrorInfo, type ReactNode } from "react";
import { logApplicationError } from "@/app/errors/errorLogging";

type AppErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logApplicationError(error, { componentStack: info.componentStack });
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    const title =
      this.props.fallbackTitle ?? "Something went wrong";
    const description =
      this.props.fallbackDescription ??
      "An unexpected error occurred. You can try again or reload the page.";

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      >
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            onClick={this.handleRetry}
          >
            Try again
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
