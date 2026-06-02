import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pathlib import Path


RAW_CSV = Path("data/raw/acled_raw.csv")
OUT_PARQUET = Path("data/processed/clean/acled_clean.parquet")


def load_raw_csv(path: Path) -> pd.DataFrame:
    print(f"Loading raw CSV from {path} ...")
    df = pd.read_csv(path, low_memory=False)
    print(f"Loaded {len(df):,} rows.")
    return df


def drop_duplicate_columns(df: pd.DataFrame) -> pd.DataFrame:
    before = df.shape[1]
    df = df.loc[:, ~df.columns.duplicated()]
    after = df.shape[1]
    print(f"Dropped {before - after} duplicate columns.")
    return df


def drop_duplicate_rows(df: pd.DataFrame) -> pd.DataFrame:
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    print(f"Dropped {before - after} duplicate rows.")
    return df


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
    )
    print("Normalized column names.")
    return df


def write_parquet(df: pd.DataFrame, path: Path):
    print(f"Writing Parquet to {path} ...")
    table = pa.Table.from_pandas(df, preserve_index=False)
    path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, path)
    print("Parquet write complete.")


def main():
    print("=== ACLED CLEAN + TRANSFORM PIPELINE START ===")

    df = load_raw_csv(RAW_CSV)
    df = drop_duplicate_columns(df)
    df = drop_duplicate_rows(df)
    df = normalize_column_names(df)

    write_parquet(df, OUT_PARQUET)

    print("=== PIPELINE COMPLETE ===")
    print(f"Cleaned Parquet saved to: {OUT_PARQUET}")


if __name__ == "__main__":
    main()
