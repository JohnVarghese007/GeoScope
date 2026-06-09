from typing import List
from fastapi import APIRouter, HTTPException, Path as FastAPIPath
import json
from app.schemas.schema import CountryYearAggregate

router = APIRouter()

GEOJSON_PATH = "./data/processed/geojson/country_year_aggregates.geojson"


def _load_geojson():
    try:
        with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("features", [])
    except Exception:
        return []


def _to_model(feature):
    p = feature["properties"]
    return CountryYearAggregate(
        iso=p["iso"],
        country=p["country"],
        year=p["year"],
        event_count=p["event_count"],
        fatalities_total=p["fatalities_total"],
        lat_mean=p["lat_mean"],
        lon_mean=p["lon_mean"],
    )


@router.get("/", response_model=List[CountryYearAggregate])
def get_metrics():
    features = _load_geojson()
    return [_to_model(f) for f in features]


@router.get("/year/{year}", response_model=List[CountryYearAggregate])
def get_metrics_by_year(year: int = FastAPIPath(...)):
    features = _load_geojson()
    filtered = [f for f in features if f["properties"]["year"] == year]
    return [_to_model(f) for f in filtered]


@router.get("/country/{iso}", response_model=List[CountryYearAggregate])
def get_metrics_by_country(iso: int = FastAPIPath(...)):
    features = _load_geojson()
    filtered = [f for f in features if f["properties"]["iso"] == iso]
    if not filtered:
        raise HTTPException(status_code=404, detail="Country not found")
    return [_to_model(f) for f in filtered]
