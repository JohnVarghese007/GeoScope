"""
Sort of a controller for the functions in ingestion/
"""
import json
from pathlib import Path
import pandas as pd
import geopandas as gpd

# Input
CLEAN_PARQUET = Path("data/processed/clean/acled_clean.parquet")

# Output directories
AGG_DIR = Path("data/processed/aggregates")
GEOJSON_DIR = Path("data/processed/geojson")

# Output files
COUNTRY_AGG = AGG_DIR / "country_agg.parquet"
EVENTS_GEOJSON = GEOJSON_DIR / "acled_points.geojson"
COUNTRIES_GEOJSON = GEOJSON_DIR / "acled_countries.geojson"



def build_country_aggregates():
    """Compute country-level metrics from cleaned ACLED data."""
    print("=== BUILDING COUNTRY AGGREGATES ===")

    df = pd.read_parquet(CLEAN_PARQUET)

    # Basic metrics — you can expand later
    agg = df.groupby("country").agg(
        event_count=("event_id_cnty", "count"),
        fatalities_total=("fatalities", "sum"),
    ).reset_index()

    AGG_DIR.mkdir(parents=True, exist_ok=True)
    agg.to_parquet(COUNTRY_AGG, index=False)

    print(f"Country aggregates saved to {COUNTRY_AGG}")


def build_events_geojson():
    print("=== BUILDING EVENTS GEOJSON (STREAMING) ===")

    df = pd.read_parquet(CLEAN_PARQUET)

    GEOJSON_DIR.mkdir(parents=True, exist_ok=True)

    with open(EVENTS_GEOJSON, "w", encoding="utf-8") as f:
        f.write('{"type": "FeatureCollection", "features": [')

        first = True

        for _, row in df.iterrows():
            lat = row["latitude"]
            lon = row["longitude"]

            if pd.isna(lat) or pd.isna(lon):
                continue

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)],
                },
                "properties": {
                    k: (None if pd.isna(v) else v)
                    for k, v in row.items()
                    if k not in ("latitude", "longitude")
                },
            }

            if not first:
                f.write(",")
            first = False

            f.write(json.dumps(feature))

        f.write("]}")



def build_country_year_geojson():
    """
    Build a GeoJSON FeatureCollection where each Feature represents
    a country-year aggregate with centroid geometry and metrics.
    """
    print("=== BUILDING COUNTRY-YEAR AGGREGATE GEOJSON ===")

    df = pd.read_parquet(CLEAN_PARQUET)

    # Ensure event_date is datetime
    df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")
    df["year"] = df["event_date"].dt.year

    # Group by country + year
    agg = (
        df.groupby(["iso", "country", "year"], as_index=False)
          .agg(
              event_count=("event_id_cnty", "count"),
              fatalities_total=("fatalities", "sum"),
              lat_mean=("latitude", "mean"),
              lon_mean=("longitude", "mean"),
          )
    )

    GEOJSON_DIR.mkdir(parents=True, exist_ok=True)
    out_path = GEOJSON_DIR / "country_year_aggregates.geojson"

    with open(out_path, "w", encoding="utf-8") as f:
        f.write('{"type": "FeatureCollection", "features": [')

        first = True

        for _, row in agg.iterrows():
            lat = row["lat_mean"]
            lon = row["lon_mean"]

            # Skip if centroid is missing
            if pd.isna(lat) or pd.isna(lon):
                continue

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)],
                },
                "properties": {
                    "iso": row["iso"],
                    "country": row["country"],
                    "year": int(row["year"]),
                    "event_count": int(row["event_count"]),
                    "fatalities_total": int(row["fatalities_total"]),
                    "lat_mean": float(lat),
                    "lon_mean": float(lon),
                }
            }

            if not first:
                f.write(",")
            first = False

            f.write(json.dumps(feature))

        f.write("]}")

    print(f"Country-year aggregate GeoJSON saved to {out_path}")
