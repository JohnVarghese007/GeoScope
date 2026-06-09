from typing import List
from fastapi import APIRouter, HTTPException, Path as FastAPIPath
import pyarrow as pa
import pyarrow.dataset as ds
from app.schemas.schema import CountryDetails

router = APIRouter()

PARQUET_PATH = "./data/processed/clean/acled_clean.parquet"


@router.get("/", response_model=List[CountryDetails])
def get_countries():
    try:
        dataset = ds.dataset(PARQUET_PATH, format="parquet")
    except Exception:
        return []

    cols = ["iso", "country", "region", "event_date", "fatalities", "sub_event_type"]
    scanner = dataset.scanner(columns=cols)

    table = pa.Table.from_batches(scanner.to_batches())
    df = table.to_pydict()

    countries = {}
    n = len(df["country"])

    for i in range(n):
        iso = df["iso"][i]
        country = df["country"][i]
        region = df["region"][i]
        date = df["event_date"][i]
        fatalities = df["fatalities"][i]
        sub = df["sub_event_type"][i]

        if country not in countries:
            countries[country] = {
                "iso_codes": set(),
                "regions": set(),
                "total_events": 0,
                "total_fatalities": 0,
                "first_event_date": None,
                "latest_event_date": None,
                "sub_event_counts": {},
            }

        c = countries[country]
        c["iso_codes"].add(iso)
        c["regions"].add(region)
        c["total_events"] += 1
        c["total_fatalities"] += fatalities if fatalities is not None else 0

        if date:
            if c["first_event_date"] is None or date < c["first_event_date"]:
                c["first_event_date"] = date
            if c["latest_event_date"] is None or date > c["latest_event_date"]:
                c["latest_event_date"] = date

        if sub:
            c["sub_event_counts"][sub] = c["sub_event_counts"].get(sub, 0) + 1

    results = []
    for country, data in countries.items():
        results.append(
            CountryDetails(
                country=country,
                iso_codes=list(data["iso_codes"]),
                regions=list(data["regions"]),
                total_events=data["total_events"],
                total_fatalities=data["total_fatalities"],
                first_event_date=data["first_event_date"],
                latest_event_date=data["latest_event_date"],
                top_sub_event_types=data["sub_event_counts"],
            )
        )

    return results


@router.get("/{iso}", response_model=CountryDetails)
def get_country(iso: int = FastAPIPath(...)):
    try:
        dataset = ds.dataset(PARQUET_PATH, format="parquet")
    except Exception:
        raise HTTPException(status_code=500, detail="Data source not available")

    cols = ["iso", "country", "region", "event_date", "fatalities", "sub_event_type"]
    expr = ds.field("iso") == iso
    scanner = dataset.scanner(filter=expr, columns=cols)

    table = pa.Table.from_batches(scanner.to_batches())
    df = table.to_pydict()

    if len(df["country"]) == 0:
        raise HTTPException(status_code=404, detail="Country not found")

    country = df["country"][0]
    regions = set()
    total_events = 0
    total_fatalities = 0
    first_event_date = None
    latest_event_date = None
    sub_event_counts = {}

    n = len(df["country"])
    for i in range(n):
        regions.add(df["region"][i])
        total_events += 1
        fat = df["fatalities"][i]
        total_fatalities += fat if fat is not None else 0

        date = df["event_date"][i]
        if date:
            if first_event_date is None or date < first_event_date:
                first_event_date = date
            if latest_event_date is None or date > latest_event_date:
                latest_event_date = date

        sub = df["sub_event_type"][i]
        if sub:
            sub_event_counts[sub] = sub_event_counts.get(sub, 0) + 1

    return CountryDetails(
        country=country,
        iso_codes=[iso],
        regions=list(regions),
        total_events=total_events,
        total_fatalities=total_fatalities,
        first_event_date=first_event_date,
        latest_event_date=latest_event_date,
        top_sub_event_types=sub_event_counts,
    )
