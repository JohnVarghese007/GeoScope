# Loading environment variables and general app settings
from dotenv import load_dotenv
import os

# Load environment variables from backend/.env
load_dotenv()

class Settings:
    ACLED_USERNAME: str = os.getenv("ACLED_USERNAME")
    ACLED_PASSWORD: str = os.getenv("ACLED_PASSWORD")

    # You can add more settings later:
    # DATABASE_URL: str = os.getenv("DATABASE_URL")
    # ENV: str = os.getenv("ENV", "development")

settings = Settings()
