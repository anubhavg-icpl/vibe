// Robust base-path joining. Works whether Astro's BASE_URL has a trailing
// slash or not (it varies by config), so internal links never collapse into
// e.g. "/vibebrowse".
const raw = import.meta.env.BASE_URL || '/';
export const BASE = raw.endsWith('/') ? raw : raw + '/';

/** Join a relative path onto the site base. `withBase('browse')` -> `/vibe/browse`. */
export function withBase(path = ''): string {
  return BASE + path.replace(/^\//, '');
}
