from dotenv import load_dotenv
import os
import requests
import time
import csv

load_dotenv(dotenv_path="data/.env")

USERNAME = os.getenv("ACLED_USERNAME")
PASSWORD = os.getenv("ACLED_PASSWORD")

TOKEN_URL = "https://acleddata.com/oauth/token"
API_URL = "https://acleddata.com/api/acled/read"

OUTPUT_FILE = "acled_global.csv"

START_YEAR = 2018
END_YEAR = 2025


def get_access_token():
    data = {
        "username": USERNAME,
        "password": PASSWORD,
        "grant_type": "password",
        "client_id": "acled",
        "scope": "authenticated",
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    r = requests.post(TOKEN_URL, data=data, headers=headers)
    r.raise_for_status()
    return r.json()["access_token"]


def fetch_page(year, page, token):
    params = {
        "_format": "json",
        "year": year,
        "page": page,
        "limit": 500,
    }

    headers = {"Authorization": f"Bearer {token}"}

    r = requests.get(API_URL, params=params, headers=headers)
    r.raise_for_status()
    return r.json()


def main():
    token = get_access_token()

    file_exists = os.path.isfile(OUTPUT_FILE)

    with open(OUTPUT_FILE, "a", newline="", encoding="utf-8") as f:
        writer = None

        for year in range(START_YEAR, END_YEAR + 1):
            print(f"Downloading year {year}...")

            # MANUAL RESUME POINT
            if year == 2018:
                page = 380
            else:
                page = 1

            while True:
                try:
                    data = fetch_page(year, page, token)
                except Exception as e:
                    print(f"Error on year {year}, page {page}: {e}")
                    print("Retrying in 5 seconds...")
                    time.sleep(5)
                    continue

                events = data.get("data", [])
                if not events:
                    break

                if writer is None:
                    writer = csv.DictWriter(f, fieldnames=events[0].keys())
                    if not file_exists:
                        writer.writeheader()

                for event in events:
                    writer.writerow(event)

                print(f"  Year {year}, page {page}, rows: {len(events)}")

                if len(events) < 500:
                    break

                page += 1
                time.sleep(0.2)

    print("Done! Global ACLED dataset saved to:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
