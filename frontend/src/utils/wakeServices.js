
const WAKE_URLS = (import.meta.env.VITE_WAKE_URLS || '')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const KEY = 'wellnest_last_wake';
const COOLDOWN_MS = 10 * 60 * 1000; // don't re-ping within 10 min

export function wakeServices() {
  if (WAKE_URLS.length === 0) return;

  const last = Number(localStorage.getItem(KEY) || 0);
  if (Date.now() - last < COOLDOWN_MS) return;
  localStorage.setItem(KEY, String(Date.now()));

  WAKE_URLS.forEach((url) => {
    // no-cors: we don't need the response, so CORS can't block the wake-up
    fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
  });
}