// Tiny pub/sub so any component can request the global paywall to open.

type Listener = () => void;
const listeners = new Set<Listener>();

export function openPaywall() {
  listeners.forEach((l) => l());
}

export function subscribePaywall(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
