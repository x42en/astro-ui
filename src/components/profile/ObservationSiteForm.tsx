import { useEffect, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../services/planning';
import { useUiStore } from '../../store/uiStore';
import type { ObservationSite, ObservationSiteCreate } from '../../types';

export interface ObservationSiteFormValues {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  timezone: string;
}

interface ObservationSiteFormProps {
  initial?: ObservationSite;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (data: ObservationSiteCreate) => void;
}

const EMPTY: ObservationSiteFormValues = {
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  elevation_m: '0',
  timezone: 'UTC',
};

function fromSite(site?: ObservationSite): ObservationSiteFormValues {
  if (!site) return EMPTY;
  return {
    name: site.name,
    description: site.description ?? '',
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    elevation_m: String(site.elevation_m),
    timezone: site.timezone,
  };
}

interface FieldErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
  elevation_m?: string;
  timezone?: string;
}

function validate(v: ObservationSiteFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = v.name.trim();
  if (!trimmedName) errors.name = 'Name is required.';
  else if (trimmedName.length > 120) errors.name = 'Maximum 120 characters.';

  const lat = Number(v.latitude);
  if (!Number.isFinite(lat)) errors.latitude = 'Latitude must be a number.';
  else if (lat < -90 || lat > 90) errors.latitude = 'Between -90 and 90.';

  const lon = Number(v.longitude);
  if (!Number.isFinite(lon)) errors.longitude = 'Longitude must be a number.';
  else if (lon < -180 || lon > 180) errors.longitude = 'Between -180 and 180.';

  const elev = Number(v.elevation_m);
  if (!Number.isFinite(elev)) errors.elevation_m = 'Elevation must be a number.';
  else if (elev < -500 || elev > 9000) errors.elevation_m = 'Between -500 and 9000.';

  if (!v.timezone.trim()) errors.timezone = 'Timezone is required.';

  return errors;
}

export function ObservationSiteForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: ObservationSiteFormProps) {
  const [values, setValues] = useState<ObservationSiteFormValues>(() => fromSite(initial));
  const [touched, setTouched] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const geo = useGeolocation();
  const { addToast } = useUiStore();

  // When the geolocation request resolves, fill the coords + reverse-geocode.
  useEffect(() => {
    if (!geo.result) return;
    const { latitude, longitude } = geo.result;
    setValues((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setGeocoding(true);
    reverseGeocode(latitude, longitude)
      .then((loc) => {
        setValues((prev) => ({
          ...prev,
          name: prev.name.trim() === '' ? loc.name : prev.name,
          elevation_m: String(Math.round(loc.elevation_m)),
          timezone: loc.timezone || prev.timezone,
        }));
        addToast({
          variant: 'info',
          title: 'Location filled',
          message: 'Review the values before saving.',
        });
      })
      .catch(() => {
        addToast({
          variant: 'warning',
          title: 'Reverse-geocode failed',
          message: 'Coordinates filled — name and elevation must be set manually.',
        });
      })
      .finally(() => {
        setGeocoding(false);
        geo.reset();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.result]);

  // Surface geolocation errors as a toast.
  useEffect(() => {
    if (geo.error) {
      addToast({ variant: 'error', title: 'Cannot use location', message: geo.error });
      geo.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.error]);

  const errors = validate(values);
  const isValid = Object.keys(errors).length === 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || null,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      elevation_m: Number(values.elevation_m),
      timezone: values.timezone.trim(),
    });
  }

  function inputCls(error?: string): string {
    return [
      'w-full rounded-md bg-space-bg border px-3 py-2 text-sm text-text-primary',
      'placeholder:text-text-muted focus:outline-none focus:border-primary',
      error && touched ? 'border-error' : 'border-space-border',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
          maxLength={120}
          className={inputCls(errors.name)}
          placeholder="My backyard, La Palma observatory…"
        />
        {touched && errors.name && (
          <p className="text-xs text-error mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          Description <span className="text-text-muted">(optional)</span>
        </label>
        <textarea
          value={values.description}
          onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
          maxLength={500}
          rows={2}
          className={inputCls()}
          placeholder="Bortle 4, southern horizon clear from 10° altitude…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Latitude</label>
          <input
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            value={values.latitude}
            onChange={(e) => setValues((p) => ({ ...p, latitude: e.target.value }))}
            className={inputCls(errors.latitude)}
            placeholder="48.8566"
          />
          {touched && errors.latitude && (
            <p className="text-xs text-error mt-1">{errors.latitude}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Longitude</label>
          <input
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            value={values.longitude}
            onChange={(e) => setValues((p) => ({ ...p, longitude: e.target.value }))}
            className={inputCls(errors.longitude)}
            placeholder="2.3522"
          />
          {touched && errors.longitude && (
            <p className="text-xs text-error mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Elevation (m)
          </label>
          <input
            type="number"
            step="1"
            value={values.elevation_m}
            onChange={(e) => setValues((p) => ({ ...p, elevation_m: e.target.value }))}
            className={inputCls(errors.elevation_m)}
          />
          {touched && errors.elevation_m && (
            <p className="text-xs text-error mt-1">{errors.elevation_m}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Timezone</label>
          <input
            type="text"
            value={values.timezone}
            onChange={(e) => setValues((p) => ({ ...p, timezone: e.target.value }))}
            className={inputCls(errors.timezone)}
            placeholder="Europe/Paris"
          />
          {touched && errors.timezone && (
            <p className="text-xs text-error mt-1">{errors.timezone}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-space-border">
        <button
          type="button"
          onClick={geo.request}
          disabled={geo.loading || geocoding}
          className="
            flex items-center gap-1.5 px-3 py-2 text-sm rounded-md
            bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          "
        >
          {geo.loading || geocoding ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <MapPin size={14} />
          )}
          <span>Use my location</span>
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (touched && !isValid)}
            className="
              flex items-center gap-1.5 px-4 py-2 text-sm rounded-md
              bg-primary hover:bg-primary-hover text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            "
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            <span>{initial ? 'Save changes' : 'Create site'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
