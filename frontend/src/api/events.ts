import { AxiosError } from 'axios';
import { apiClient } from './client';
import type { EventDetails } from './types';

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

export async function fetchEventDetails(eventId: string): Promise<EventDetails> {
  const trimmed = eventId.trim();
  if (!trimmed) throw new Error('Event id is required');

  try {
    const resp = await apiClient.get<EventDetails>(`/events/${encodeURIComponent(trimmed)}`);
    return resp.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

export async function fetchEventsList(params?: { country?: string; iso?: number; limit?: number }): Promise<EventDetails[]> {
  try {
    const resp = await apiClient.get<EventDetails[]>('/events', { params });
    return resp.data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

