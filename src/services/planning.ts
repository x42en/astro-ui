import api from '../lib/axios';
import type {
  GeoLocation,
  ObjectForecast,
  ObjectVisibility,
  ObservationWindow,
  RecommendationBundle,
  WeatherForecast,
} from '../types';

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  return (await api.get<GeoLocation>('/planning/geocode/reverse', { params: { lat, lon } })).data;
}

export async function getWeather(
  lat: number,
  lon: number,
  days = 16,
): Promise<WeatherForecast> {
  return (await api.get<WeatherForecast>('/planning/weather', { params: { lat, lon, days } })).data;
}

export interface WindowParams {
  lat: number;
  lon: number;
  elevation: number;
  date: string;
  timezone?: string;
}

export async function getNightWindow(p: WindowParams): Promise<ObservationWindow> {
  return (await api.get<ObservationWindow>('/planning/window', { params: p })).data;
}

export interface RecommendationParams extends WindowParams {
  min_altitude?: number;
  limit?: number;
  type?: string[];
}

export async function getRecommendations(p: RecommendationParams): Promise<RecommendationBundle> {
  return (await api.get<RecommendationBundle>('/planning/recommendations', { params: p })).data;
}

export async function getObjectVisibility(
  catalogId: string,
  p: WindowParams,
): Promise<ObjectVisibility> {
  return (
    await api.get<ObjectVisibility>(
      `/planning/object/${encodeURIComponent(catalogId)}/visibility`,
      { params: p },
    )
  ).data;
}

export interface ObjectForecastParams {
  lat: number;
  lon: number;
  elevation: number;
  start_date?: string;
  days?: number;
  min_altitude?: number;
  timezone?: string;
}

export async function getObjectForecast(
  catalogId: string,
  p: ObjectForecastParams,
): Promise<ObjectForecast> {
  return (
    await api.get<ObjectForecast>(
      `/planning/object/${encodeURIComponent(catalogId)}/forecast`,
      { params: p },
    )
  ).data;
}
