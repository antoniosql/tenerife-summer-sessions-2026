# Fabric notebook: 01_bronze_ingesta_gx
# Demo 1: bronze ingestion and executable data-quality profiling.

# COMMAND ----------

import sys

repo_src = "/lakehouse/default/Files/src"
if repo_src not in sys.path:
    sys.path.insert(0, repo_src)

# COMMAND ----------

from notebookutils import mssparkutils
from frasohome_fabric.config import BRONZE_FILES_PATH
from frasohome_fabric.io import ingest_bronze_tables

display(mssparkutils.fs.ls(BRONZE_FILES_PATH))

# COMMAND ----------

bronze = ingest_bronze_tables(spark, BRONZE_FILES_PATH)
for name, df in bronze.items():
    print(name, df.count(), len(df.columns))

# COMMAND ----------

crm = spark.table("bronze_crm")
display(crm.select("customer_id", "email", "tier_fidelizacion", "ultima_actualizacion").limit(20))

# COMMAND ----------

display(
    crm.groupBy("tier_fidelizacion")
    .count()
    .orderBy("tier_fidelizacion")
)

# COMMAND ----------

from frasohome_fabric.quality import bronze_crm_expectations, validate_dataframe_with_suite

crm_result = validate_dataframe_with_suite(
    crm,
    "crm_bronze_contract",
    bronze_crm_expectations(),
)
print(crm_result.describe())

# COMMAND ----------

tiendas = spark.table("bronze_tiendas")
display(
    tiendas.groupBy("store_id")
    .count()
    .where("count > 1")
)

# COMMAND ----------

from great_expectations import expectations as gxe

tiendas_result = validate_dataframe_with_suite(
    tiendas,
    "tiendas_bronze_contract",
    [
        gxe.ExpectColumnValuesToNotBeNull(column="store_id"),
        gxe.ExpectColumnValuesToBeUnique(column="store_id"),
    ],
)
print(tiendas_result.describe())

