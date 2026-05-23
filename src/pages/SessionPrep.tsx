import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const FETCH_MIN_ALT = 5;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SessionPrep() {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (recsQuery.error) {
      const msg = recsQuery.error instanceof Error ? recsQuery.error.message : 'Unknown error';
      addToast({ variant: 'error', title: t('sessionPrep.errorToast'), message: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recsQuery.error]);

  useEffect(() => {
    if (weatherQuery.error) {
      const msg = weatherQuery.error instanceof Error ? weatherQuery.error.message : 'Unknown error';
      addToast({ variant: 'error', title: t('sessionPrep.weatherErrorToast'), message: msg });
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
    () => t('sessionPrep.subtitle'),
    [t],
  );

  return (
    <div className="min-h-screen bg-space-bg">
      {!isAuthenticated && (
        <div className="bg-primary-muted/40 border-b border-primary/30">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-sm">
            <p className="text-text-primary truncate">
              <Sparkles size={14} className="inline mr-1.5 -mt-0.5 text-accent" />
              {t('sessionPrep.signInBanner')}
            </p>
            <Link
              to="/login?redirect=%2Fprepare"
              className="shrink-0 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors"
            >
              {t('sessionPrep.signIn')}
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fade-in">
        <SectionHeading
          kicker={t('sessionPrep.kicker')}
          title={t('sessionPrep.title')}
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

        {hasSite && (
          <WeatherStrip
            forecast={weatherQuery.data}
            isLoading={weatherQuery.isLoading}
            selectedDate={date}
            onDateSelect={setDate}
          />
        )}

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

        {!hasSite && (
          <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-10 text-center">
            <p className="text-text-secondary">
              {t('sessionPrep.pickLocation')}
            </p>
          </div>
        )}

        {hasSite && hasDate && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('sessionPrep.recommendedTargets')}
              </h3>
              {recs.length > 0 && (
                <span className="text-xs text-text-muted">
                  {t('sessionPrep.objectsAbove', { count: recs.length, minAltitude })}
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
                  {t('sessionPrep.loadingError')}
                </p>
              </div>
            )}

            {!recsQuery.isLoading && !recsQuery.isError && recs.length === 0 && (
              <div className="bg-space-surface border border-dashed border-space-border rounded-xl p-10 text-center">
                <p className="text-text-secondary">
                  {t('sessionPrep.noTargets', { minAltitude })}
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
