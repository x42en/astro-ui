import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Bind a piece of state to a single URL search param.
 *
 * The hook keeps the URL as the source of truth: reading the value parses
 * the current `?key=...`, writing it triggers a navigation that updates the
 * query string in place (no history entries are pushed).
 *
 * @typeParam T - Logical type of the state value.
 * @param key - Search-param name (e.g. `'date'`).
 * @param defaultValue - Returned when the param is absent or fails to parse.
 * @param parse - Convert the raw string to `T`. Throw or return `null` to
 *                fall back to `defaultValue`.
 * @param serialize - Convert `T` back to a string. Returning `null` removes
 *                    the param from the URL.
 */
export function useSearchParamState<T>(
  key: string,
  defaultValue: T,
  parse: (raw: string) => T | null,
  serialize: (value: T) => string | null,
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();

  const value = useMemo<T>(() => {
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    try {
      const parsed = parse(raw);
      return parsed === null ? defaultValue : parsed;
    } catch {
      return defaultValue;
    }
  }, [params, key, defaultValue, parse]);

  const setValue = useCallback(
    (next: T) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          const serialized = serialize(next);
          if (serialized === null || serialized === '') {
            updated.delete(key);
          } else {
            updated.set(key, serialized);
          }
          return updated;
        },
        { replace: true },
      );
    },
    [setParams, key, serialize],
  );

  return [value, setValue];
}

// ── Convenience parsers/serializers ─────────────────────────────────────────

export const stringParam = {
  parse: (raw: string): string => raw,
  serialize: (v: string): string | null => (v === '' ? null : v),
};

export const numberParam = {
  parse: (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  },
  serialize: (v: number): string => String(v),
};

export const stringArrayParam = {
  parse: (raw: string): string[] => raw.split(',').filter((s) => s.length > 0),
  serialize: (v: string[]): string | null => (v.length === 0 ? null : v.join(',')),
};
