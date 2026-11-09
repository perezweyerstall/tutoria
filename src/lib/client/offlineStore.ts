export interface QueuedOfflineMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH';
  body: Record<string, unknown>;
  label: string;
  queuedAt: string;
}

const SNAPSHOT_KEY = 'tutoria.offline.snapshot.v1';
const QUEUE_KEY = 'tutoria.offline.queue.v1';

export function saveOfflineSnapshotCache(snapshot: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function loadOfflineSnapshotCache<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadOfflineQueue(): QueuedOfflineMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedOfflineMutation[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(
  item: Omit<QueuedOfflineMutation, 'id' | 'queuedAt'>
): QueuedOfflineMutation[] {
  if (typeof window === 'undefined') return [];
  const current = loadOfflineQueue();
  const next: QueuedOfflineMutation[] = [
    ...current,
    {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: new Date().toISOString(),
    },
  ];
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function saveOfflineQueue(queue: QueuedOfflineMutation[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore
  }
}

export async function clearAllClientOfflineData(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SNAPSHOT_KEY);
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Ignore
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_TUTORIA_CACHES' });
  }
  if ('caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('tutoria-') || k.startsWith('principia-'))
          .map((k) => window.caches.delete(k))
      );
    } catch {
      // Ignore
    }
  }
}
