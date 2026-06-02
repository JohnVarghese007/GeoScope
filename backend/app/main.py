from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router

# Creating a FastAPI instance
app = FastAPI(title="GeoScope API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering the API router with the main app
app.router.include_router(api_router, prefix="/api")


# health check
@app.get("/")
def health():
    return {"status": "ok"}
