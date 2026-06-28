# Fabric notebook: 02_silver_gold_ai_quality
# Demo 2: syntactic cleanup, AI Functions for semantic cleanup, gold fact, GX gate.

# COMMAND ----------

import sys

repo_src = "/lakehouse/default/Files/src"
if repo_src not in sys.path:
    sys.path.insert(0, repo_src)

# COMMAND ----------

from frasohome_fabric.io import write_delta_table
from frasohome_fabric.silver import (
    silver_crm,
    silver_devoluciones_online,
    silver_devoluciones_tienda,
    silver_lineas_pedido,
    silver_pedidos,
    silver_productos,
    silver_stock,
    silver_tiendas,
    silver_ventas_pos,
)

crm = silver_crm(spark.table("bronze_crm"))
productos = silver_productos(spark.table("bronze_productos"))
tiendas = silver_tiendas(spark.table("bronze_tiendas"))
pedidos = silver_pedidos(spark.table("bronze_pedidos"))
lineas = silver_lineas_pedido(spark.table("bronze_lineas_pedido"))
ventas_pos = silver_ventas_pos(spark.table("bronze_ventas_pos"))
dev_online = silver_devoluciones_online(spark.table("bronze_devoluciones_online"))
dev_tienda = silver_devoluciones_tienda(spark.table("bronze_devoluciones_tienda"))
stock = silver_stock(spark.table("bronze_stock_diario"))

# COMMAND ----------

for table_name, df in {
    "silver_productos": productos,
    "silver_tiendas": tiendas,
    "silver_pedidos": pedidos,
    "silver_lineas_pedido": lineas,
    "silver_ventas_pos": ventas_pos,
    "silver_stock_diario": stock,
}.items():
    write_delta_table(df, table_name)
    print(table_name, df.count())

# COMMAND ----------

# Semantic cleanup with Fabric AI Functions.
# This cell intentionally requires Fabric Runtime AI Functions; no local mock is used.
from frasohome_fabric.ai_functions import classify_return_reason, classify_tier

crm_ai = classify_tier(crm)
dev_online_ai = classify_return_reason(dev_online)
dev_tienda_ai = classify_return_reason(dev_tienda)

write_delta_table(crm_ai, "silver_crm")
write_delta_table(dev_online_ai, "silver_devoluciones_online")
write_delta_table(dev_tienda_ai, "silver_devoluciones_tienda")

display(crm_ai.groupBy("tier_fidelizacion_raw", "tier_fidelizacion").count().orderBy("tier_fidelizacion_raw"))

# COMMAND ----------

from frasohome_fabric.gold import build_gold_fact

gold_fact = build_gold_fact(
    ventas_pos=spark.table("silver_ventas_pos"),
    pedidos=spark.table("silver_pedidos"),
    lineas_pedido=spark.table("silver_lineas_pedido"),
    devoluciones_online=spark.table("silver_devoluciones_online"),
    devoluciones_tienda=spark.table("silver_devoluciones_tienda"),
    crm=spark.table("silver_crm"),
    productos=spark.table("silver_productos"),
)
write_delta_table(gold_fact, "gold_fact_transacciones")

print("gold_fact_transacciones", gold_fact.count(), len(gold_fact.columns))
display(gold_fact.select("fact_id", "source_file", "tipo_movimiento", "fecha_movimiento", "customer_id", "product_id", "importe_abs", "importe_signed").limit(20))

# COMMAND ----------

from frasohome_fabric.quality import gold_fact_expectations, validate_dataframe_with_suite

gold_result = validate_dataframe_with_suite(
    spark.table("gold_fact_transacciones"),
    "gold_fact_contract",
    gold_fact_expectations(),
)
print(gold_result.describe())

# COMMAND ----------

display(
    spark.sql("""
    SELECT
      ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 2) AS ventas,
      ROUND(SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END), 2) AS devoluciones,
      ROUND(
        SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END)
        / SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END),
        4
      ) AS tasa_devolucion,
      ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN margen_bruto ELSE 0 END), 2) AS margen_bruto
    FROM gold_fact_transacciones
    """)
)

