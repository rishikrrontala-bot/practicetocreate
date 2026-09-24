/// <reference lib="webworker" />
import { compute } from './compute';
import type { AppState } from './engine/state';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<{ id: number; state: AppState }>) => {
  const { id, state } = e.data;
  try {
    const result = compute(state);
    // Copies, not transfers: the grid stays cached here for the next request.
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
