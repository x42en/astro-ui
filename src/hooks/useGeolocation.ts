import { useCallback, useState } from 'react';

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface GeolocationState {
  loading: boolean;
  result: GeolocationResult | null;
  error: string | null;
  request: () => void;
  reset: () => void;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

/**
 * Browser-geolocation hook. Idle by default; only triggers the permission
 * prompt when `request()` is explicitly called from a user action.
 */
export function useGeolocation(options: PositionOptions = DEFAULT_OPTIONS): GeolocationState {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeolocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setResult({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve location.');
        setLoading(false);
      },
      options,
    );
  }, [options]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { loading, result, error, request, reset };
}
