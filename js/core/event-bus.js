// Minimal publish/subscribe bus. Listener errors are isolated so one broken screen can't stop the game.

export function createEventBus({ onError = e => console.error(e) } = {}) {
  const listeners = new Map();

  const off = (type, fn) => listeners.get(type)?.delete(fn);

  const on = (type, fn) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(fn);
    return () => off(type, fn);
  };

  const once = (type, fn) => {
    const unsubscribe = on(type, payload => { unsubscribe(); fn(payload); });
    return unsubscribe;
  };

  const emit = (type, payload) => {
    for (const fn of [...(listeners.get(type) ?? [])]) {
      try { fn(payload); } catch (e) { onError(e); }
    }
    for (const fn of [...(listeners.get('*') ?? [])]) {
      try { fn({ type, payload }); } catch (e) { onError(e); }
    }
  };

  return { on, off, once, emit };
}
