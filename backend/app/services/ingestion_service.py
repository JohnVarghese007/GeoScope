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


# ============================================================
# 1. COUNTRY‑LEVEL AGGREGATES
# ============================================================

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


# ============================================================
# 2. EVENTS GEOJSON (POINTS)
# ============================================================

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



# ============================================================
# 3. COUNTRY GEOJSON (POLYGONS + METRICS)
# ============================================================
def build_country_geojson():
    """Merge country aggregates with world polygons to produce a choropleth-ready GeoJSON."""
    print("=== BUILDING COUNTRY POLYGON GEOJSON ===")

    # Load aggregates
    agg = pd.read_parquet(COUNTRY_AGG)

    # Load Natural Earth polygons
    from pathlib import Path
    NE_PATH = Path("data/external/natural_earth/ne_110m_admin_0_countries.shp")
    world = gpd.read_file(NE_PATH)

    # Merge using ISO codes (correct + reliable)
    merged = world.merge(agg, left_on="ISO_A3", right_on="iso", how="left")

    # Save output
    GEOJSON_DIR.mkdir(parents=True, exist_ok=True)
    merged.to_file(COUNTRIES_GEOJSON, driver="GeoJSON")

    print(f"Country polygons GeoJSON saved to {COUNTRIES_GEOJSON}")
