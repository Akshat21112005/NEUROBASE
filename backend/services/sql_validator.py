import re
import logging
from typing import Optional

logger = logging.getLogger("neurobase.sql_validator")

_DANGEROUS_KEYWORDS = frozenset([
    "DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE",
    "TRUNCATE", "PRAGMA", "ATTACH", "DETACH", "REINDEX", "VACUUM",
])

_AGGREGATE_MARKERS = ("COUNT(", "SUM(", "AVG(", "MAX(", "MIN(", "GROUP BY")

def validate(
    sql: str,
    table_name: str = None,
    columns: list = None,
) -> tuple[Optional[str], Optional[str]]:
    if not sql or not sql.strip():
        return None, "SQL query is empty."

    sql = sql.strip()
    sql_upper = sql.upper()

    if not sql_upper.startswith("SELECT"):
        return None, "Only SELECT queries are permitted."

    for keyword in _DANGEROUS_KEYWORDS:
        if re.search(rf"\b{keyword}\b", sql_upper):
            return None, f"Statement contains a forbidden keyword: '{keyword}'."

    # Standardizing some common AI hallucinations
    if "LIMIT" not in sql_upper and not any(m in sql_upper for m in _AGGREGATE_MARKERS):
        sql += " LIMIT 100"
        logger.debug("Appended LIMIT 100 to non-aggregate query.")

    return sql, None
