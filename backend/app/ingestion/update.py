from app.ingestion.fetch_data import download_acled_raw
from app.ingestion.clean_data import clean_acled_raw
from app.services.ingestion_service import (
    build_country_aggregates,
    build_events_geojson,
    build_country_year_geojson,
)

def run_pipeline(
        download : bool = False,
        clean : bool = False,
        aggregates : bool = False,
        events_geojson : bool = False,
        country_year_geojson : bool = False
    ):

    print("\n=== RUNNING INGESTION PIPELINE  ===\n")
    if download:
        download_acled_raw()
    if clean:
        clean_acled_raw()
    if aggregates:
        build_country_aggregates()
    if events_geojson:
        build_events_geojson()
    if country_year_geojson:
        build_country_year_geojson()

    print("\n=== INGESTION PIPELINE COMPLETE ===\n")


if __name__ == "__main__":
    # Change arguments here as required to run desired steps in pipeline
    run_pipeline(
        download=False,
        clean=False,
        aggregates=False,
        events_geojson=False,
        country_year_geojson=False
    )

