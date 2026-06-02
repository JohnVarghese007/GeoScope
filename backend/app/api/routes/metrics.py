from fastapi import APIRouter

"""
    API endpoints related to metrics can be defined here.
"""

router = APIRouter()


@router.get("/global")
def get_global_metrics():
    return {"message": "global metrics endpoint working"}


# GET /metrics/trends
@router.get("/trends")
def get_trend_metrics():
    return {"message": "trend metrics endpoint working"}


# GET /metrics/heatmap
@router.get("/heatmap")
def get_heatmap_metrics():
    return {"message": "heatmap metrics endpoint working"}
