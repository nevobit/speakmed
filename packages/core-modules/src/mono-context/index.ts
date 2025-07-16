type StateValue = unknown;

export interface MonoContextState {
  [key: string]: StateValue;
}

interface MonoContextData {
  state: MonoContextState;
  counts: Record<string, number>;
  stateCreatedAt: Date;
  stateUpdatedAt: Date;
}

let contextData: MonoContextData = {
  state: {},
  counts: {},
  stateCreatedAt: new Date(),
  stateUpdatedAt: new Date()
};

export function setState<T extends MonoContextState>(newState: Partial<T>): void {
  contextData.state = { ...contextData.state, ...newState };
  contextData.stateUpdatedAt = new Date();
}

export function getState<T extends MonoContextState>(): T & {
  stateCreatedAt: Date;
  stateUpdatedAt: Date;
} {
  return {
    ...contextData.state as T,
    stateCreatedAt: contextData.stateCreatedAt,
    stateUpdatedAt: contextData.stateUpdatedAt,
  };
}

export function getStateValue<T extends MonoContextState, K extends keyof T>(key: K): T[K] | undefined {
  return contextData.state[key as string] as T[K] | undefined;
}

export function count(key: string): number {
  contextData.counts[key] = (contextData.counts[key] || 0) + 1;
  return contextData.counts[key] || 0;
}

export function getCount(key: string): number {
  return contextData.counts[key] || 0;
}

export function resetCount(key: string): void {
  delete contextData.counts[key];
}

export function resetAllCounts(): void {
  contextData.counts = {};
}

export function resetState(): void {
  contextData = {
    state: {},
    counts: {},
    stateCreatedAt: new Date(),
    stateUpdatedAt: new Date()
  };
}

export const MonoContext = {
  setState,
  getState,
  getStateValue,
  count,
  getCount,
  resetCount,
  resetAllCounts,
  resetState
};
