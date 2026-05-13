from fastapi import APIRouter

"""
    Just a stub for any api enpoints related to events.
"""

router = APIRouter()


# GET /events
@router.get("/")
def get_events():
    return {"message": "events endpoint working"}
