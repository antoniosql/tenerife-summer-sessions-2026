# Fabric notebook: 03_features_scoring_semantic
# Demo 3: customer/product features and scoring tables.

# COMMAND ----------

import sys

repo_src = "/lakehouse/default/Files/src"
if repo_src not in sys.path:
    sys.path.insert(0, repo_src)

# COMMAND ----------

from frasohome_fabric.gold import build_customer_features, build_customer_score, build_product_features
from frasohome_fabric.io import write_delta_table

customer_features = build_customer_features(spark)
product_features = build_product_features(spark)
customer_score = build_customer_score(customer_features)

write_delta_table(customer_features, "gold_cliente_features")
write_delta_table(product_features, "gold_producto_features")
write_delta_table(customer_score, "gold_cliente_score")

# COMMAND ----------

display(
    spark.sql("""
    SELECT
      COUNT(*) AS clientes_con_score,
      SUM(CASE WHEN riesgo_fuga THEN 1 ELSE 0 END) AS clientes_riesgo_fuga,
      ROUND(AVG(score), 1) AS score_medio
    FROM gold_cliente_score
    """)
)

# COMMAND ----------

display(
    spark.sql("""
    SELECT *
    FROM gold_cliente_score
    WHERE riesgo_fuga
    ORDER BY score ASC, recencia_dias DESC
    LIMIT 25
    """)
)

# COMMAND ----------

display(
    spark.sql("""
    SELECT
      categoria,
      ROUND(SUM(ventas), 2) AS ventas,
      ROUND(SUM(margen_bruto), 2) AS margen,
      ROUND(SUM(devoluciones), 2) AS devoluciones,
      ROUND(SUM(devoluciones) / NULLIF(SUM(ventas), 0), 4) AS tasa_devolucion
    FROM gold_producto_features
    GROUP BY categoria
    ORDER BY tasa_devolucion DESC
    """)
)

