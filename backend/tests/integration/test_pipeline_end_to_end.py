import pandas as pd
from src.validation.dataset_checks import check_split_integrity, DataContractError

def test_time_based_split_never_leaks():
    idx = pd.date_range("2026-01-01", periods=1000, freq="1h")
    df = pd.DataFrame({"datetime_utc": idx, "pm25": range(1000)})
    split_point = 800
    train_df, test_df = df.iloc[:split_point], df.iloc[split_point:]
    check_split_integrity(train_df, test_df)  # should not raise

def test_time_based_split_catches_leakage():
    idx = pd.date_range("2026-01-01", periods=1000, freq="1h")
    df = pd.DataFrame({"datetime_utc": idx, "pm25": range(1000)})
    shuffled = df.sample(frac=1, random_state=1).reset_index(drop=True)  # simulate an accidental random split
    train_df, test_df = shuffled.iloc[:800], shuffled.iloc[800:]
    try:
        check_split_integrity(train_df, test_df)
        assert False, "Expected DataContractError on a leaky (randomly shuffled) split"
    except DataContractError:
        pass
