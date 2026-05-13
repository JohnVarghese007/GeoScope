# Backend Info

We will be using uv for this project instead of pip since its fast and keeps track of all dependencies installed and such.

To create venv
> uv venv

Initialize venv
> source .venv/Scripts/activate  // or whatever else the command is for  your specific environment

To sync dependencies:
> uv sync

To add new dependencies
> uv add <name_of_dependency>

To run any file with uv
> uv run <regular_command>

To run backend with uv
> uv run uvicorn app.main:app --reload

## Sample Project Structure
- Can be changed to whatever, this is just a basic scaffolding
```bash
backend/
│
├── app/
│   ├── main.py
│   ├── api/                      # APIs and routers
│   │   ├── router.py
│   │   └── routes/
│   │       ├── countries.py
│   │       ├── events.py
│   │       └── metrics.py
│   ├── core/                     # commonly used stuff + logging can be optionally implemented later on
│   │   ├── config.py
│   │   └── logging.py
│   ├── db/                       # Whatever DB stuff
│   │   ├── base.py
│   │   ├── session.py
│   │   └── models/               # Database models
│   │       ├── country.py
│   │       └── event.py
│   ├── ingestion/                # To automatically update info at fixed intervals and update DB
│   │   ├── clean_data.py
│   │   ├── fetch_data.py
│   │   └── update.py
│   ├── schemas/                  # Pydantic schemas for API request/response validation
│   │   └── schema.py
│   ├── services/                 # Core logic from api/ should mostly be implemented here
│   │   ├── analytics_service.py
│   │   ├── event_service.py
│   │   └── ingestion_service.py
│   └── utils/
│       └── utils.py
├── data/   # To store any CSVs, JSON/metdata etc.
│   ├── raw/
│   └── processed/
├── .env
├── .env.example                  
├── .python-version
├── pyproject.toml                 
├── README.md
├── uv.lock
```