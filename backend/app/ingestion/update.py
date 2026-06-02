from app.ingestion.fetch_data import download_acled_raw
from app.ingestion.clean_data import clean_acled_raw
from app.services.ingestion_service import (
    build_country_aggregates,
    build_events_geojson,
    build_country_geojson,
)


def run_all():
    download_acled_raw()
    clean_acled_raw()
    build_country_aggregates()
    build_events_geojson()
    build_country_geojson()


def run_download_only():
    download_acled_raw()


def run_clean_only():
    clean_acled_raw()


def run_aggregates_only():
    build_country_aggregates()


def run_events_geojson_only():
    build_events_geojson()


def run_country_geojson_only():
    build_country_geojson()
