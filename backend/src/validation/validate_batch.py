from pydantic import ValidationError
import pandas as pd
import logging

logger = logging.getLogger("ingestion.validation")

def validate_records(records: list[dict], schema) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Splits a batch into (valid_df, rejected_df). Rejected rows are never silently
    dropped — they're written to data/raw/_rejected/ for audit, which is what you
    want when a reviewer asks "how much data did you discard, and why?"
    """
    valid, rejected = [], []
    for rec in records:
        try:
            validated = schema(**rec)
            valid.append(validated.model_dump())
        except ValidationError as e:
            rejected.append({**rec, "_validation_error": str(e)})
    return pd.DataFrame(valid), pd.DataFrame(rejected)
