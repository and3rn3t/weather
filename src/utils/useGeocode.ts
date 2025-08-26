// Client helper for server-side geocoding with cache
export interface GeocodeResult { lat: number; lon: number; source: 'cache' | 'nominatim' }

export async function geocode(city: string): Promise<GeocodeResult> {
  const url = `/api/geocode?q=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  return (await res.json()) as GeocodeResult;
}
