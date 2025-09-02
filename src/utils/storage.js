const ns = 'brandlab:v1:';

export const saveDraft = (key, value) => {
  try { localStorage.setItem(ns + key, JSON.stringify(value)); } catch {}
};
export const loadDraft = (key, fallback) => {
  try {
    const raw = localStorage.getItem(ns + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
