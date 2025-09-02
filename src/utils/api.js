export async function postJSON(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload.data;
}
