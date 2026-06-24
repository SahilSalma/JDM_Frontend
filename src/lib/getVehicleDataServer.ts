const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function getMakes(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/admin/settings/public`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json();
    if (!body?.data?.vehicle_data) return [];
    const parsed = JSON.parse(body.data.vehicle_data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: { name?: string }) => m.name).filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}
