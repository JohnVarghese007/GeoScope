from typing import List, Optional

from fastapi import APIRouter, HTTPException, Path as FastAPIPath, Query

import pyarrow as pa
import pyarrow.dataset as ds

from app.schemas.schema import Event

router = APIRouter()

# Parquet dataset path (processed clean ACLED parquet)
PARQUET_PATH = "./data/processed/clean/acled_clean.parquet"


def _serialize_row(row: dict) -> dict:
    # Normalizing types and handling missing values for API response
    return {
        "event_id_cnty": row.get("event_id_cnty"),
        "event_date": None if row.get("event_date") is None else str(row.get("event_date")),
        "year": int(row.get("year")) if row.get("year") is not None else None,
        "iso": row.get("iso"),
        "country": row.get("country"),
        "latitude": float(row.get("latitude")) if row.get("latitude") is not None else None,
        "longitude": float(row.get("longitude")) if row.get("longitude") is not None else None,
        "event_type": row.get("event_type"),
        "sub_event_type": row.get("sub_event_type"),
        "fatalities": int(row.get("fatalities")) if row.get("fatalities") is not None else None,
        "notes": row.get("notes"),
    }


@router.get("/", response_model=List[Event])
def get_events(
    iso: Optional[int] = Query(None),
    country: Optional[str] = Query(None),
    limit: int = Query(100, gt=0, le=1000)
) -> List[Event]:

    try:
        dataset = ds.dataset(PARQUET_PATH, format="parquet")
    except Exception:
        return []

    cols = [
        "event_id_cnty",
        "event_date",
        "year",
        "iso",
        "country",
        "latitude",
        "longitude",
        "event_type",
        "sub_event_type",
        "fatalities",
        "notes",
    ]

    expr = None
    if iso is not None:
        expr = ds.field("iso") == iso  
    elif country:
        expr = ds.field("country") == country.strip()

    scanner = dataset.scanner(filter=expr, columns=cols) if expr is not None else dataset.scanner(columns=cols)

    results: List[Event] = []

    for batch in scanner.to_batches():
        table = pa.Table.from_batches([batch])
        data = table.to_pydict()
        n = len(data.get("event_id_cnty", []))

        for i in range(n):
            row = {k: data[k][i] if i < len(data[k]) else None for k in cols}
            results.append(Event(**_serialize_row(row)))  
            if len(results) >= limit:
                return results

    return results


@router.get("/{event_id_cnty}", response_model=Event) 
def get_event(event_id_cnty: str = FastAPIPath(..., min_length=1)) -> Event:

    eid = event_id_cnty.strip()
    if not eid:
        raise HTTPException(status_code=404, detail="Event not found")

    try:
        dataset = ds.dataset(PARQUET_PATH, format="parquet")
    except Exception:
        raise HTTPException(status_code=500, detail="Data source not available")

    cols = [
        "event_id_cnty",
        "event_date",
        "year",
        "iso",
        "country",
        "latitude",
        "longitude",
        "event_type",
        "sub_event_type",
        "fatalities",
        "notes",
    ]

    expr = ds.field("event_id_cnty") == eid
    scanner = dataset.scanner(filter=expr, columns=cols)

    for batch in scanner.to_batches():
        table = pa.Table.from_batches([batch])
        data = table.to_pydict()
        n = len(data.get("event_id_cnty", []))

        for i in range(n):
            row = {k: data[k][i] if i < len(data[k]) else None for k in cols}
            return Event(**_serialize_row(row)) 

    raise HTTPException(status_code=404, detail="Event not found")
