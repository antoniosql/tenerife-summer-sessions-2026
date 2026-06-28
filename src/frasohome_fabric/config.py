"""Configuration constants for the FraSoHome Fabric demo."""

BRONZE_FILES_PATH = "Files/bronze"

RAW_TABLES = {
    "crm": "crm.csv",
    "devoluciones_online": "devoluciones_online.csv",
    "devoluciones_tienda": "devoluciones_tienda.csv",
    "lineas_pedido": "lineas_pedido.csv",
    "pagos_tienda": "pagos_tienda.csv",
    "pedidos": "pedidos.csv",
    "productos": "productos.csv",
    "stock_diario": "stock_diario.csv",
    "tiendas": "tiendas.csv",
    "ventas_pos": "ventas_pos.csv",
}

REFERENCE_FACT_FILE = "fact_transacciones.csv"

BRONZE_PREFIX = "bronze_"
SILVER_PREFIX = "silver_"
GOLD_PREFIX = "gold_"

CANONICAL_TIERS = ["Bronce", "Plata", "Oro", "Platino"]
CANONICAL_CATEGORIES = ["Decoracion", "Iluminacion", "Muebles", "Textil hogar"]
RETURN_REASON_LABELS = [
    "Talla o medidas",
    "Defecto o producto incompleto",
    "No cumple expectativa",
    "Cambio de opinion",
    "Logistica o transporte",
    "Fraude o excepcion",
]

