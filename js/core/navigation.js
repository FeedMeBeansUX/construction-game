// Screen router. A screen module exports `mount(ui, ctx, params)` and may return a cleanup function.

export function createNavigator({ ui, screens, ctx, bus }) {
  let current = null;
  let cleanup = null;

  function go(name, params = {}) {
    const screen = screens[name];
    if (!screen) throw new Error(`Unknown screen: ${name}`);
    if (typeof cleanup === 'function') cleanup();
    cleanup = null;
    ui.replaceChildren();
    ui.dataset.screen = name;
    current = name;
    cleanup = screen.mount(ui, ctx, params) ?? null;
    bus.emit('screen.change', { name, params });
  }

  return { go, get current() { return current; } };
}
