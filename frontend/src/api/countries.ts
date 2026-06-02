export type CountryDetails = {
  country: string;
  iso_codes: string[];
  regions: string[];
  total_events: number;
  total_fatalities: number;
  first_event_date: string | null;
  latest_event_date: string | null;
  top_sub_event_types: Record<string, number>;
};

import { AxiosError } from 'axios';
import { apiClient } from './client';

type ApiErrorResponse = {
  detail?: string;
  message?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    return responseData?.detail ?? responseData?.message ?? error.message ?? 'Request failed';
  }

  return error instanceof Error ? error.message : 'Request failed';
}

export async function fetchCountryDetails(countryIdentifier: string): Promise<CountryDetails> {
  const trimmedIdentifier = countryIdentifier.trim();

  if (!trimmedIdentifier) {
    throw new Error('Country identifier is required');
  }

  try {
    const response = await apiClient.get<CountryDetails>(
      `/countries/${encodeURIComponent(trimmedIdentifier)}`,
    );

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}