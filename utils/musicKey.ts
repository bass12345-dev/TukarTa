/** A real musical key: a note letter, optional sharp or flat, optional minor/major suffix (e.g. G, F#m, Bb, Dmaj). */
const KEY_PATTERN = /^[A-G][#b]?(m|min|maj)?$/;

/** True only for a usable key. Empty, null, placeholder dashes and anything that isn't a key return false. */
export function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_PATTERN.test(key.trim());
}

/** Key text to display, or null when the song has no real key (so the label should be hidden). */
export function displayKey(key: unknown): string | null {
  return isValidKey(key) ? key.trim() : null;
}
