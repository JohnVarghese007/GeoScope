from fastapi import APIRouter, HTTPException, Path as FastAPIPath

"""
    Event endpoints stubbed for now.
"""

router = APIRouter()


# Stubs for now, will implement real logic once we have the postgres DB set up and connected and data is migrated from csv/parquet into it.
@router.get("/")
def get_events():
    return {"message": "events endpoint stub", "stub": True}


@router.get("/{event_id_cnty}")
def get_event(event_id_cnty: str = FastAPIPath(..., min_length=1)):
    if not event_id_cnty.strip():
        raise HTTPException(status_code=404, detail="Event not found")

    return {
        "message": "event detail endpoint stub",
        "stub": True,
        "event_id_cnty": event_id_cnty,
    }
