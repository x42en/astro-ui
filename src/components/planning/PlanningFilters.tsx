import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Plus } from 'lucide-react';
import {
  SearchableSelect,
  type SelectGroup,
} from '../ui/SearchableSelect';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useIsAuthenticated } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { listObservationSites } from '../../services/observationSites';
import { reverseGeocode } from '../../services/planning';
import type { ObservationSite } from '../../types';

export const BROWSER_SITE_VALUE = '__browser__';
export const CUSTOM_SITE_VALUE = '__custom__';

/**
 * A resolved location used by `/prepare` queries. Either points back to a
 * persisted site (`source: 'site'`) or carries inline coordinates from the
 * browser geolocation / custom form (`source: 'browser' | 'custom'`).
 */
export interface ResolvedSite {
  source: 'site' | 'browser' | 'custom';
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  timezone: string;
}

export const OBJECT_TYPES = [
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'nebula', label: 'Nebula' },
  { value: 'cluster', label: 'Cluster' },
  { value: 'planetary', label: 'Planetary' },
  { value: 'supernova', label: 'SNR' },
] as const;

interface PlanningFiltersProps {
  selectedSiteValue: string | null;
  onSelectedSiteValueChange: (value: string) => void;
  resolvedSite: ResolvedSite | null;
  onResolvedSiteChange: (site: ResolvedSite | null) => void;

  date: string;
  onDateChange: (date: string) => void;

  minAltitude: number;
  onMinAltitudeChange: (alt: number) => void;

  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxDateIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
}

export function PlanningFilters({
  selectedSiteValue,
  onSelectedSiteValueChange,
  resolvedSite,
  onResolvedSiteChange,
  date,
  onDateChange,
  minAltitude,
  onMinAltitudeChange,
  selectedTypes,
  onSelectedTypesChange,
}: PlanningFiltersProps) {
  const isAuthenticated = useIsAuthenticated();
  const { addToast } = useUiStore();
  const geo = useGeolocation();

  const sitesQuery = useQuery({
    queryKey: ['observation_sites'],
    queryFn: listObservationSites,
    enabled: isAuthenticated,
  });

  const sites: ObservationSite[] = sitesQuery.data ?? [];

  // Custom-site inline form.
  const [customLat, setCustomLat] = useState('');
  const [customLon, setCustomLon] = useState('');
  const [customElev, setCustomElev] = useState('0');
  const [customError, setCustomError] = useState<string | null>(null);

  // When a saved site is picked, resolve it.
  useEffect(() => {
    if (!selectedSiteValue) return;
    if (selectedSiteValue === BROWSER_SITE_VALUE || selectedSiteValue === CUSTOM_SITE_VALUE) {
      return;
    }
    const site = sites.find((s) => s.id === selectedSiteValue);
    if (site) {
      onResolvedSiteChange({
        source: 'site',
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        elevation_m: site.elevation_m,
        timezone: site.timezone,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteValue, sites]);

  // Auto-pick the first persisted site when authenticated and nothing chosen.
  useEffect(() => {
    if (!selectedSiteValue && isAuthenticated && sites.length > 0) {
      onSelectedSiteValueChange(sites[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, sites]);

  // Browser geolocation: trigger ONLY when the user picks the option.
  useEffect(() => {
    if (selectedSiteValue !== BROWSER_SITE_VALUE) return;
    if (resolvedSite?.source === 'browser') return;
    geo.request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteValue]);

  // Resolve geolocation result with reverse geocoding.
  useEffect(() => {
    if (!geo.result) return;
    const { latitude, longitude } = geo.result;
    onResolvedSiteChange({
      source: 'browser',
      id: BROWSER_SITE_VALUE,
      name: 'Current location',
      latitude,
      longitude,
      elevation_m: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
    reverseGeocode(latitude, longitude)
      .then((loc) => {
        onResolvedSiteChange({
          source: 'browser',
          id: BROWSER_SITE_VALUE,
          name: loc.name || 'Current location',
          latitude,
          longitude,
          elevation_m: Math.round(loc.elevation_m),
          timezone: loc.timezone || 'UTC',
        });
      })
      .catch(() => {
        /* keep transient values */
      })
      .finally(() => geo.reset());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.result]);

  useEffect(() => {
    if (geo.error) {
      addToast({ variant: 'error', title: 'Cannot use location', message: geo.error });
      geo.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.error]);

  function applyCustom() {
    const lat = Number(customLat);
    const lon = Number(customLon);
    const elev = Number(customElev);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setCustomError('Latitude must be between -90 and 90.');
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setCustomError('Longitude must be between -180 and 180.');
      return;
    }
    if (!Number.isFinite(elev)) {
      setCustomError('Elevation must be a number.');
      return;
    }
    setCustomError(null);
    onResolvedSiteChange({
      source: 'custom',
      id: CUSTOM_SITE_VALUE,
      name: 'Custom location',
      latitude: lat,
      longitude: lon,
      elevation_m: elev,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
  }

  const groups = useMemo<SelectGroup<string>[]>(() => {
    const out: SelectGroup<string>[] = [];
    if (isAuthenticated && sites.length > 0) {
      out.push({
        label: 'My sites',
        options: sites.map((s) => ({
          value: s.id,
          label: s.name,
          description: `${s.latitude.toFixed(2)}°, ${s.longitude.toFixed(2)}°`,
        })),
      });
    }
    out.push({
      label: 'Other',
      options: [
        {
          value: BROWSER_SITE_VALUE,
          label: 'Use browser location',
          description: 'Asks for your device position',
        },
        {
          value: CUSTOM_SITE_VALUE,
          label: 'Custom coordinates…',
          description: 'Enter latitude / longitude',
        },
      ],
    });
    return out;
  }, [isAuthenticated, sites]);

  return (
    <div className="lg:sticky lg:top-16 z-20">
      <div className="bg-space-surface/80 backdrop-blur border border-space-border rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Site */}
          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
              Location
            </label>
            <SearchableSelect<string>
              value={selectedSiteValue}
              onChange={(v) => onSelectedSiteValueChange(v)}
              options={groups}
              placeholder="Choose a location…"
              searchable
              ariaLabel="Observation location"
              renderTrigger={(opt) => {
                if (geo.loading && selectedSiteValue === BROWSER_SITE_VALUE) {
                  return (
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Loader2 size={14} className="animate-spin" />
                      Locating…
                    </span>
                  );
                }
                if (resolvedSite) {
                  return (
                    <span className="flex items-center gap-1.5 text-text-primary truncate">
                      <MapPin size={14} className="text-text-secondary shrink-0" />
                      <span className="truncate">{resolvedSite.name}</span>
                    </span>
                  );
                }
                return <span className="text-text-muted">{opt?.label ?? 'Choose a location…'}</span>;
              }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
              Night of
            </label>
            <input
              type="date"
              value={date}
              min={todayIso()}
              max={maxDateIso()}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full bg-space-bg border border-space-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Min altitude */}
          <div>
            <label className="flex items-center justify-between text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
              <span>Min altitude</span>
              <span className="text-text-secondary normal-case font-mono tracking-normal">
                {minAltitude}°
              </span>
            </label>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={minAltitude}
              onChange={(e) => onMinAltitudeChange(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Object types */}
          <div>
            <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
              Object types
            </label>
            <div className="flex flex-wrap gap-1.5">
              {OBJECT_TYPES.map((t) => {
                const active = selectedTypes.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      onSelectedTypesChange(
                        active
                          ? selectedTypes.filter((x) => x !== t.value)
                          : [...selectedTypes, t.value],
                      )
                    }
                    className={[
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      active
                        ? 'bg-primary-muted border-primary/40 text-primary'
                        : 'bg-space-elevated border-space-border text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom site inline form */}
        {selectedSiteValue === CUSTOM_SITE_VALUE && (
          <div className="border-t border-space-border pt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                placeholder="48.8566"
                className="w-full bg-space-bg border border-space-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={customLon}
                onChange={(e) => setCustomLon(e.target.value)}
                placeholder="2.3522"
                className="w-full bg-space-bg border border-space-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide font-semibold text-text-muted mb-1">
                Elevation (m)
              </label>
              <input
                type="number"
                step="1"
                value={customElev}
                onChange={(e) => setCustomElev(e.target.value)}
                className="w-full bg-space-bg border border-space-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              <Plus size={14} />
              Apply
            </button>
            {customError && (
              <p className="sm:col-span-4 text-xs text-error">{customError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
