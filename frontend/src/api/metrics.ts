import { apiClient } from './client';
import type { CountryYearAggregate } from './types';

export async function fetchMetrics(): Promise<CountryYearAggregate[]> {
  const resp = await apiClient.get<CountryYearAggregate[]>('/metrics');
  return resp.data;
}

export async function fetchMetricsByYear(year: number): Promise<CountryYearAggregate[]> {
  const resp = await apiClient.get<CountryYearAggregate[]>(`/metrics/year/${year}`);
  return resp.data;
}

export async function fetchMetricsByCountry(iso: number): Promise<CountryYearAggregate[]> {
  const resp = await apiClient.get<CountryYearAggregate[]>(`/metrics/country/${iso}`);
  return resp.data;
}
