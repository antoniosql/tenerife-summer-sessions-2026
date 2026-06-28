"""Great Expectations helpers for Fabric Spark notebooks."""

from __future__ import annotations

from pyspark.sql import DataFrame


def require_gx():
    try:
        import great_expectations as gx
    except ImportError as exc:
        raise RuntimeError(
            "great_expectations is not installed in the Fabric Spark Environment. "
            "Add it as a Public library, publish the Environment, and attach this notebook."
        ) from exc
    return gx


def validate_dataframe_with_suite(df: DataFrame, suite_name: str, expectations: list):
    gx = require_gx()
    ctx = gx.get_context()
    try:
        suite = ctx.suites.get(name=suite_name)
    except Exception:
        suite = ctx.suites.add(gx.ExpectationSuite(name=suite_name))
    for expectation in expectations:
        suite.add_expectation(expectation)
    ds = ctx.data_sources.add_or_update_spark(name="fabric_spark")
    asset = ds.add_dataframe_asset(name=suite_name)
    batch_definition = asset.add_batch_definition_whole_dataframe("current_batch")
    batch = batch_definition.get_batch(batch_parameters={"dataframe": df})
    return batch.validate(suite)


def bronze_crm_expectations():
    gx = require_gx()
    return [
        gx.expectations.ExpectColumnValuesToNotBeNull(column="customer_id"),
        gx.expectations.ExpectColumnValuesToBeUnique(column="customer_id"),
        gx.expectations.ExpectColumnValuesToMatchRegex(column="email", regex=r"^[^@]+@[^@]+\.[^@]+$", mostly=0.90),
        gx.expectations.ExpectColumnValuesToBeInSet(column="tier_fidelizacion", value_set=["Bronce", "Plata", "Oro", "Platino"]),
    ]


def gold_fact_expectations():
    gx = require_gx()
    return [
        gx.expectations.ExpectColumnValuesToBeInSet(column="tipo_movimiento", value_set=["VENTA", "DEVOLUCION"]),
        gx.expectations.ExpectColumnValuesToNotBeNull(column="fecha_movimiento", mostly=0.995),
        gx.expectations.ExpectColumnValuesToNotBeNull(column="importe_abs", mostly=0.995),
        gx.expectations.ExpectColumnValuesToBeBetween(column="importe_abs", min_value=0, max_value=50000, mostly=0.995),
        gx.expectations.ExpectColumnValuesToBeInSet(column="categoria", value_set=["Decoracion", "Iluminacion", "Muebles", "Textil hogar"], mostly=0.95),
    ]

