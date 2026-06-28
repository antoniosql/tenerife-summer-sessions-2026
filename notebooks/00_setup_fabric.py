# Fabric notebook: 00_setup_fabric
# Purpose: one-time checks before recording.

# COMMAND ----------

from notebookutils import mssparkutils

print("Attached Lakehouse files:")
display(mssparkutils.fs.ls("Files"))

# COMMAND ----------

expected = [
    "crm.csv",
    "devoluciones_online.csv",
    "devoluciones_tienda.csv",
    "fact_transacciones.csv",
    "lineas_pedido.csv",
    "pagos_tienda.csv",
    "pedidos.csv",
    "productos.csv",
    "stock_diario.csv",
    "tiendas.csv",
    "ventas_pos.csv",
]
actual = {f.name for f in mssparkutils.fs.ls("Files/bronze")}
missing = sorted(set(expected) - actual)
extra = sorted(actual - set(expected))
print({"missing": missing, "extra": extra})
assert not missing, f"Missing bronze files: {missing}"

# COMMAND ----------

# Attach a Fabric Environment with:
# - great_expectations
# - Fabric Runtime with AI Functions enabled
try:
    import great_expectations as gx
    print("Great Expectations:", gx.__version__)
except ImportError as exc:
    raise RuntimeError("Install great_expectations in the Fabric Environment and publish it.") from exc

# COMMAND ----------

# If the repo source is uploaded to Files/src, make it importable from this notebook session.
import sys

repo_src = "/lakehouse/default/Files/src"
if repo_src not in sys.path:
    sys.path.insert(0, repo_src)

from frasohome_fabric.config import RAW_TABLES

print("Source modules available. Raw tables:", sorted(RAW_TABLES))

