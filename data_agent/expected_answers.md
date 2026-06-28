# Expected Answers for Recording

Use these as guardrails while rehearsing the Data Agent. Exact numbers may change if the scoring rule or gold fact reconstruction changes.

## Prompt 1

**Question:** Que categorias devuelven mas y como afecta al margen?

Expected answer shape:

- Rank categories by `Tasa devolución`.
- Mention sales, returns and margin for the top category.
- Suggested interpretation: higher return rate erodes operational margin and should trigger product/content/logistics review.

Validation query:

```sql
SELECT categoria, ventas, devoluciones, tasa_devolucion
FROM (
  SELECT
    categoria,
    SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END) AS ventas,
    SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END) AS devoluciones,
    SUM(CASE WHEN tipo_movimiento = 'DEVOLUCION' THEN importe_abs ELSE 0 END)
      / NULLIF(SUM(CASE WHEN tipo_movimiento = 'VENTA' THEN importe_abs ELSE 0 END), 0) AS tasa_devolucion
  FROM gold_fact_transacciones
  GROUP BY categoria
) q
ORDER BY tasa_devolucion DESC;
```

## Prompt 2

**Question:** Comparame ventas netas y margen por canal.

Expected answer shape:

- POS is the larger channel.
- ONLINE is smaller but material.
- Use the official `Ventas netas` and `Margen bruto` definitions.

## Prompt 3

**Question:** Que clientes en riesgo conviene reactivar y con que oferta?

Expected answer shape:

- Use `gold_cliente_score`.
- Select lowest scores with high recency.
- Recommend a reactivation offer tied to preferred/top category where available.
- Make the output actionable for Rayfin: customer id, score, reason, suggested offer.

