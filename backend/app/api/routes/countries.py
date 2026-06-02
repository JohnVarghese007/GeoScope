from fastapi import APIRouter, HTTPException, Path as FastAPIPath

"""
    Country endpoints stubbed for now.
    - Will implement real logic once we have the postgres DB setup and connected and data is migrated from csv/parquet into it.
"""

router = APIRouter()


@router.get("/")
def get_countries():
    return {"message": "countries endpoint stub", "stub": True}


@router.get("/{country_identifier}")
def get_country(country_identifier: str = FastAPIPath(..., min_length=1)):
    if not country_identifier.strip():
        raise HTTPException(status_code=404, detail="Country not found")

    return {
        "message": "country detail endpoint stub",
        "stub": True,
        "country_identifier": country_identifier,
    }
