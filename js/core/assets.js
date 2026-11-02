// Loads SVG assets once at boot (same-origin files; cached by the PWA later) and creates instances.

export const ASSET_FILES = {
  location: 'assets/environments/location-magazijn.svg',
  truck: 'assets/machinery/truck.svg',
  bram: 'assets/characters/char-bram.svg',
  sam: 'assets/characters/char-sam.svg',
};

export async function loadAssets(base = '') {
  const entries = await Promise.all(Object.entries(ASSET_FILES).map(async ([key, path]) => {
    const res = await fetch(base + path);
    if (!res.ok) throw new Error(`Asset ${path}: ${res.status}`);
    return [key, await res.text()];
  }));
  return Object.fromEntries(entries);
}

/** Parse SVG text into an element. With a prefix, every id and #reference gets "prefix-" so copies don't clash. */
export function instantiate(svgText, prefix = '') {
  let text = svgText;
  if (prefix) {
    text = text
      .replace(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
      .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
  }
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const el = doc.documentElement;
  if (el.nodeName !== 'svg') throw new Error('Invalid SVG asset');
  return document.importNode(el, true);
}
