// Client hook for Favorites backed by Cloudflare Pages Functions
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface FavoriteCity {
  city: string;
  lat: number;
  lon: number;
  added_at: number;
}

function getDeviceId(): string {
  const key = 'device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceId = useMemo(getDeviceId, []);

  const headers = useMemo(
    () => ({ 'X-Device-Id': deviceId, 'Content-Type': 'application/json' }),
    [deviceId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites', { headers });
      if (!res.ok) throw new Error('Failed to load favorites');
      const data = (await res.json()) as FavoriteCity[];
      setFavorites(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const add = useCallback(
    async (city: string, lat: number, lon: number) => {
      setError(null);
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers,
        body: JSON.stringify({ city, lat, lon }),
      });
      if (!res.ok) throw new Error('Failed to add favorite');
      const data = (await res.json()) as FavoriteCity[];
      setFavorites(data);
    },
    [headers]
  );

  const remove = useCallback(
    async (city: string) => {
      setError(null);
      const res = await fetch(
        `/api/favorites?city=${encodeURIComponent(city)}`,
        { method: 'DELETE', headers }
      );
      if (!res.ok) throw new Error('Failed to remove favorite');
      await load();
    },
    [headers, load]
  );

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return { favorites, loading, error, add, remove, refresh: load } as const;
}
