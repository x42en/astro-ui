import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { SectionHeading } from '../components/landing/SectionHeading';
import { Skeleton } from '../components/ui/Skeleton';
import {
  PlanningFilters,
  type ResolvedSite,
} from '../components/planning/PlanningFilters';
import { NightConditionsCard } from '../components/planning/NightConditionsCard';
import { WeatherStrip } from '../components/planning/WeatherStrip';
import { RecommendationCard } from '../components/planning/RecommendationCard';
import {
  useSearchParamState,
  numberParam,
  stringParam,
  stringArrayParam,
} from '../hooks/useSearchParamState';
import { useIsAuthenticated } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { getRecommendations, getWeather } from '../services/planning';

/** Minimum baseline altitude used for the backend fetch (°).
 *  All objects above this threshold are fetched once per site+date.
 *  Type and altitude filters are then applied client-side so that the
 *  night-conditions stats never re-fetch on a filter change. */
const FETCH_MIN_ALT = 5;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SessionPrep() {
  const isAuthenticated = useIsAuthenticated();
  const { addToast } = useUiStore();

  const [selectedSiteValue, setSelectedSiteValue] = useSearchParamState<string>(
    's',
    '',
    stringParam.parse,
    stringParam.serialize,
  );
  const [date, setDate] = useSearchParamState<string>(
    'd',
    todayIso(),
    stringParam.parse,
    stringParam.serialize,
  );
  const [minAltitude, setMinAltitude] = useSearchParamState<number>(
    'a',
    30,
    numberParam.parse,
    numberParam.serialize,
  );
  const [selectedTypes, setSelectedTypes] = useSearchParamState<string[]>(
    't',
    [],
    stringArrayParam.parse,
    stringArrayParam.serialize,
  );

  const [resolvedSite, setResolvedSite] = useState<ResolvedSite | null>(null);

  const hasSite = resolvedSite !== null;
  const hasDate = !!date;

  const weatherQuery = useQuery({
    queryKey: ['planning_weather', resolvedSite?.latitude, resolvedSite?.longitude],
    queryFn: () => getWeather(resolvedSite!.latitude, resolvedSite!.longitude, 16),
    enabled: hasSite,
    staleTime: 10 * 60 * 1000,
  });

  const recsQuery = useQuery({
    queryKey: [
      'planning_recs',
      resolvedSite?.latitude,
      resolvedSite?.longitude,
      resolvedSite?.elevation_m,
      date,
    ],
    queryFn: () =>
      getRecommendations({
        lat: resolvedSite!.latitude,
        lon: resolvedSite!.longitude,
        elevation: resolvedSite!.elevation_m,
        date,
        timezone: resolvedSite!.timezone,
        min_altitude: FETCH_MIN_ALT,
        limit: 50,
      }),
    enabled: hasSite && hasDate,
    retry: 1,
  });

  // Surface query errors as toasts (deduplicated by message).
  useEffect(() => {
    if (recsQuery.error) {
      const msg = recsQuery.error instanceof Error ? recsQuery.error.message : 'Unknown error';
      addToast({ variant: 'error', title: 'Could not compute recommendations', message: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recsQuery.error]);

  useEffect(() => {
    if (weatherQuery.error) {
      const msg = weatherQuery.error instanceof Error ? weatherQuery.error.message : 'Unknown error';
      addToast({ variant: 'error', title: 'Weather forecast unavailable', message: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherQuery.error]);

  const recs = useMemo(() => {
    const all = recsQuery.data?.recommendations ?? [];
    return all.filter(
      r =>
        r.max_altitude_deg >= minAltitude &&
        (selectedTypes.length === 0 || selectedTypes.includes(r.type)),
    );
  }, [recsQuery.data, minAltitude, selectedTypes]);
  const window = recsQuery.data?.window;
  const weatherSummary = recsQuery.data?.weather_summary ?? null;
  const timezone = resolvedSite?.timezone ?? 'UTC';

  const subtitle = useMemo(
    () =>
      'Pick a location, check the night, and discover the best deep-sky targets — like a travel agency for the cosmos.',
    [],
  );

  return (
    <div className="min-h-screen bg-space-bg">
      {!isAuthenticated && (
        <div className="bg-primary-muted/40 border-b border-primary/30">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-sm">
            <p className="text-text-primary truncate">
              <Sparkles size={14} className="inline mr-1.5 -mt-0.5 text-accent" />
              Sign in to save your sites and follow your favourite targets.
            </p>
            <Link
              to="/login?redirect=%2Fprepare"
              className="shrink-0 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in">
        <SectionHeading
          kicker="Planning"
          title="Plan your next imaging night"
          subtitle={subtitle}
        />

        <PlanningFilters
          selectedSiteValue={selectedSiteValue || null}
          onSelectedSiteValueChange={setSelectedSiteValue}
          resolvedSite={resolvedSite}
          onResolvedSiteChange={setResolvedSite}
          date={date}
          onDateChange={setDate}
          minAltitude={minAltitude}
          onMinAltitudeChange={setMinAltitude}
          selectedTypes={selectedTypes}
          onSelectedTypesChange={setSelectedTypes}
        />

        {/* Weather strip — needs only a site */}
        {hasSite && (
          <WeatherStrip
            forecast={weatherQuery.data}
            isLoading={weatherQuery.isLoading}
            selectedDate={date}
            onDateSelect={setDate}
          />
        )}

        {/* Night conditions */}
        {hasSite && hasDate && (
          <>
            {recsQuery.isLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            )}
            {window && (
              <NightConditionsCard
                window={window}
                weatherSummary={weatherSummary}
                timezone={timezone}
              />
            )}
          </>
        )}

        {/* Recommendations */}
        {!hasSite && (
          <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-10 text-center">
            <p className="text-text-secondary">
              Pick a location above to see tonight&apos;s best targets.
            </p>
          </div>
        )}

        {hasSite && hasDate && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">
                Recommended targets
              </h3>
              {recs.length > 0 && (
                <span className="text-xs text-text-muted">
                  {recs.length} object{recs.length === 1 ? '' : 's'} above {minAltitude}°
                </span>
              )}
            </div>

            {recsQuery.isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-44" />
                ))}
              </div>
            )}

            {!recsQuery.isLoading && recsQuery.isError && (
              <div className="bg-space-surface border border-error/40 rounded-xl p-6 text-center">
                <AlertCircle size={20} className="mx-auto text-error mb-2" />
                <p className="text-sm text-text-secondary">
                  Something went wrong while computing recommendations. Try a different date or
                  lower the minimum altitude.
                </p>
              </div>
            )}

            {!recsQuery.isLoading && !recsQuery.isError && recs.length === 0 && (
              <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-10 text-center">
                <p className="text-text-secondary">
                  No targets reach {minAltitude}° tonight. Try lowering the minimum altitude or
                  picking another date.
                </p>
              </div>
            )}

            {!recsQuery.isLoading && recs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {recs.map((rec) => (
                  <RecommendationCard
                    key={rec.catalog_id}
                    visibility={rec}
                    minAltitudeDeg={minAltitude}
                    timezone={timezone}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
