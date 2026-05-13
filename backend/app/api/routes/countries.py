from fastapi import APIRouter

"""
    Just a stub for any api enpoints related to countries.
"""

router = APIRouter()


@router.get("/")
def get_countries():
    return {"message": "countries endpoint working"}
