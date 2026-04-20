export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const r = await fetch('/api/' + endpoint);
  return r.json();
}

export async function apiPost<T = any>(endpoint: string, body: any): Promise<T & { error?: string }> {
  try {
    const r = await fetch('/api/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  } catch (e: any) {
    return { error: e.message } as any;
  }
}

export async function apiPatch<T = any>(endpoint: string, id: string | number, body: any): Promise<T & { error?: string }> {
  try {
    const r = await fetch('/api/' + endpoint + '?id=' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  } catch (e: any) {
    return { error: e.message } as any;
  }
}

export async function apiDelete(endpoint: string, id: string | number): Promise<{ success?: boolean; error?: string }> {
  try {
    const r = await fetch('/api/' + endpoint + '?id=' + id, { method: 'DELETE' });
    return r.json();
  } catch (e: any) {
    return { error: e.message };
  }
}
