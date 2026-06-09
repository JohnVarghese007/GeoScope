export interface CountryDetails {
  country: string;
  iso_codes: string[];
  regions: string[];
  total_events: number;
  total_fatalities: number;
  first_event_date: string | null;
  latest_event_date: string | null;
  top_sub_event_types: Record<string, number>;
}

export interface EventDetails {
  event_id_cnty: string;
  event_date: string | null;
  year?: number | null;
  iso?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  event_type?: string | null;
  sub_event_type?: string | null;
  fatalities?: number | null;
  notes?: string | null;
}

export interface CountryYearAggregate {
  iso: number;
  country: string;
  year: number;
  event_count: number;
  fatalities_total: number;
  lat_mean: number | null;
  lon_mean: number | null;
}
