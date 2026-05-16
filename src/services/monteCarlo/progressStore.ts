export type MonteCarloProgressState = {
  completedGames: number;
  totalGames: number;
  timeRemainingLabel: string | null;
  isStopping: boolean;
} | null;

type Listener = (state: MonteCarloProgressState) => void;

class MonteCarloProgressStore {
  private state: MonteCarloProgressState = null;
  private listeners: Set<Listener> = new Set();

  getState() {
    return this.state;
  }

  setState(nextState: MonteCarloProgressState) {
    if (nextState !== null) {
      if (
        typeof nextState.completedGames !== "number" ||
        typeof nextState.totalGames !== "number" ||
        isNaN(nextState.completedGames) ||
        isNaN(nextState.totalGames)
      ) {
        console.error("Invalid MonteCarloProgressState: numeric values required", nextState);
        return;
      }
      if (nextState.completedGames < 0 || nextState.totalGames < 0) {
        console.error("Invalid MonteCarloProgressState: negative values not allowed", nextState);
        return;
      }
      if (
        typeof nextState.isStopping !== "boolean" ||
        (nextState.timeRemainingLabel !== null && typeof nextState.timeRemainingLabel !== "string")
      ) {
        console.error("Invalid MonteCarloProgressState: type mismatch for isStopping or timeRemainingLabel", nextState);
        return;
      }
    }
    this.state = nextState;
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      try {
        this.listeners.delete(listener);
      } catch (e) {
        console.error("Error during unsubscription from MonteCarloProgressStore", e);
      }
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (e) {
        console.error("Error in MonteCarloProgressStore listener", e);
      }
    });
  }
}

export const progressStore = new MonteCarloProgressStore();
