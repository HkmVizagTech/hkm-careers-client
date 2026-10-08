/**
 * Remembers where an applicant came from (?src=linkedin on a shared job link)
 * for the rest of the browser session, so it can be saved with the application.
 */
const KEY = 'hkm_apply_source';

export function captureApplySource(): void {
  if (typeof window === 'undefined') return;
  try {
    const src = new URLSearchParams(window.location.search).get('src');
    const clean = src?.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    if (clean) sessionStorage.setItem(KEY, clean);
  } catch {
    /* storage blocked: source is optional */
  }
}

export function readApplySource(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
