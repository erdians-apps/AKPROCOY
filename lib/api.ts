export const GSHEET_WEBAPP_URL = process.env.NEXT_PUBLIC_GSHEET_URL || '';

export async function fetchData(action: string): Promise<unknown> {
  if (!GSHEET_WEBAPP_URL) {
    console.warn('GSHEET_WEBAPP_URL is not configured');
    return null;
  }

  const url = `${GSHEET_WEBAPP_URL}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`GSheet fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function postData(action: string, payload: unknown): Promise<unknown> {
  if (!GSHEET_WEBAPP_URL) {
    console.warn('GSHEET_WEBAPP_URL is not configured');
    return null;
  }

  const res = await fetch(GSHEET_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    throw new Error(`GSheet post failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
