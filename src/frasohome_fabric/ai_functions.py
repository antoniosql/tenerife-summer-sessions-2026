"""Thin wrappers for Microsoft Fabric AI Functions.

These functions intentionally do not mock AI Functions. They call Fabric's Spark AI
API when available and use deterministic rules only as an explicit fallback for
finite reference data where the canonical answer is known.
"""

from __future__ import annotations

from pyspark.sql import DataFrame
from pyspark.sql import functions as F

from frasohome_fabric.config import CANONICAL_TIERS, RETURN_REASON_LABELS
from frasohome_fabric.normalize import normalize_tier_rule_based, normalize_ascii_key


def classify_tier(df: DataFrame, input_col: str = "tier_fidelizacion_raw") -> DataFrame:
    try:
        return df.ai.classify(
            input_col=input_col,
            labels=CANONICAL_TIERS,
            output_col="tier_fidelizacion_ai",
        ).withColumn(
            "tier_fidelizacion",
            F.coalesce(F.col("tier_fidelizacion_ai"), normalize_tier_rule_based(F.col(input_col))),
        )
    except AttributeError as exc:
        raise RuntimeError(
            "Fabric AI Functions are not available on this Spark runtime. "
            "Attach the notebook to a Fabric Runtime with AI Functions enabled."
        ) from exc


def classify_return_reason(df: DataFrame, input_col: str = "motivo_devolucion_raw") -> DataFrame:
    try:
        return df.ai.classify(
            input_col=input_col,
            labels=RETURN_REASON_LABELS,
            output_col="motivo_devolucion_ai",
        ).withColumn(
            "motivo_devolucion_norm",
            F.coalesce(F.col("motivo_devolucion_ai"), deterministic_return_reason(F.col(input_col))),
        )
    except AttributeError as exc:
        raise RuntimeError(
            "Fabric AI Functions are not available on this Spark runtime. "
            "Attach the notebook to a Fabric Runtime with AI Functions enabled."
        ) from exc


def deterministic_return_reason(col):
    key = normalize_ascii_key(col)
    return (
        F.when(key.rlike("medida|encaja|talla"), F.lit("Talla o medidas"))
        .when(key.rlike("defect|pieza|incompleto|dañ|dano"), F.lit("Defecto o producto incompleto"))
        .when(key.rlike("gusto|color|expectativa"), F.lit("No cumple expectativa"))
        .when(key.rlike("opinion"), F.lit("Cambio de opinion"))
        .when(key.rlike("tarde|transporte|envio|logistica"), F.lit("Logistica o transporte"))
        .when(key.rlike("fraude|otro"), F.lit("Fraude o excepcion"))
    )

