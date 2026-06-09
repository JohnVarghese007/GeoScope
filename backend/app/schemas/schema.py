from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Dict


class Event(BaseModel):
    event_id_cnty: str
    event_date: Optional[date]
    year: Optional[int]
    iso: Optional[int]  
    country: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    event_type: Optional[str]
    sub_event_type: Optional[str]
    fatalities: Optional[int]
    notes: Optional[str]

class CountryDetails(BaseModel):
    country: str
    iso_codes: List[int]  
    regions: List[str]
    total_events: int
    total_fatalities: int
    first_event_date: Optional[date]
    latest_event_date: Optional[date]
    top_sub_event_types: Dict[str, int]

class CountryYearAggregate(BaseModel):
    iso: int
    country: str
    year: int
    event_count: int
    fatalities_total: int
    lat_mean: Optional[float]
    lon_mean: Optional[float]