from fastapi import FastAPI
from app.api.router import api_router

# Creating a FastAPI instance
app = FastAPI(title="GeoScope API", version="0.1.0")

# Registering the API router with the main app
app.router.include_router(api_router, prefix="/api")


# health check
@app.get("/")
def health():
    return {"status": "ok"}
