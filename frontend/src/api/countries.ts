import { AxiosError } from 'axios';
import { apiClient } from './client';
import type { CountryDetails } from './types';

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

export async function fetchCountryDetails(iso: string): Promise<CountryDetails> {
  const trimmedIso = (iso || '').trim().toUpperCase();

  if (!trimmedIso) {
    throw new Error('Country ISO code is required');
  }

  try {
    const response = await apiClient.get<CountryDetails>(`/countries/${encodeURIComponent(trimmedIso)}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}