-- FraSoHome Fabric demo validation queries.
-- Run these from the Lakehouse SQL analytics endpoint after notebooks 01-03.

-- 1. Official headline metrics.
SELECT
    ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 2) AS ventas,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END), 2) AS devoluciones,
    ROUND(
        SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END)
        / NULLIF(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 0),
        4
    ) AS tasa_devolucion,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN margen_bruto ELSE 0 END), 2) AS margen_bruto
FROM gold_fact_transacciones;

-- 2. Sales by channel.
SELECT
    canal_movimiento,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 2) AS ventas,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN margen_bruto ELSE 0 END), 2) AS margen
FROM gold_fact_transacciones
GROUP BY canal_movimiento
ORDER BY ventas DESC;

-- 3. Return rate by category.
SELECT
    categoria,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 2) AS ventas,
    ROUND(SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END), 2) AS devoluciones,
    ROUND(
        SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END)
        / NULLIF(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 0),
        4
    ) AS tasa_devolucion
FROM gold_fact_transacciones
WHERE categoria IS NOT NULL
GROUP BY categoria
ORDER BY tasa_devolucion DESC;

-- 4. Customers at churn risk.
SELECT
    COUNT(*) AS clientes_riesgo_fuga
FROM gold_cliente_score
WHERE riesgo_fuga = 1;

-- 5. Customers to reactivate.
SELECT TOP 25
    s.customer_id,
    s.score,
    s.recencia_dias,
    s.gasto_total,
    s.tasa_devolucion_cliente
FROM gold_cliente_score AS s
WHERE s.riesgo_fuga = 1
ORDER BY s.score ASC, s.recencia_dias DESC;

-- 6. Quality gate residue.
SELECT
    SUM(CASE WHEN flag_fecha_parseada = 0 THEN 1 ELSE 0 END) AS fechas_no_parseadas,
    SUM(CASE WHEN flag_importe_parseado = 0 THEN 1 ELSE 0 END) AS importes_no_parseados,
    SUM(CASE WHEN flag_customer_in_crm = 0 THEN 1 ELSE 0 END) AS clientes_fuera_crm,
    SUM(CASE WHEN flag_product_in_master = 0 THEN 1 ELSE 0 END) AS productos_fuera_master
FROM gold_fact_transacciones;

