import type { ColumnMetadataMap } from "@/lib/to-data-table";

import baseQuery from "./risk-customers.dax?raw";

export const RISK_CUSTOMER_COLUMNS = {
  customerId: "[customer_id]",
  channel: "[canal]",
  score: "[score]",
  recencyDays: "[recencia_dias]",
  totalSpend: "[gasto_total]",
  returnRate: "[tasa_devolucion_cliente]",
  preferredCategory: "[categoria_preferida]",
} as const;

export const riskCustomerColumnMetadata: ColumnMetadataMap = {
  "[customer_id]": { name: "customer_id", displayName: "Cliente" },
  "[canal]": { name: "canal", displayName: "Canal" },
  "[score]": { name: "score", displayName: "Score", format: "#,##0" },
  "[recencia_dias]": { name: "recencia_dias", displayName: "Recencia", format: "#,##0" },
  "[gasto_total]": { name: "gasto_total", displayName: "Gasto", format: "#,##0 EUR" },
  "[tasa_devolucion_cliente]": {
    name: "tasa_devolucion_cliente",
    displayName: "Tasa devolucion",
    format: "0.0%",
  },
  "[categoria_preferida]": { name: "categoria_preferida", displayName: "Categoria" },
};

type RiskCustomerFilters = {
  category: string;
  channel: string;
};

export function frasohomeRiskCustomers(filters: RiskCustomerFilters) {
  return {
    connection: "frasohomeModel",
    query: buildRiskCustomersQuery(filters),
    columnMetadata: riskCustomerColumnMetadata,
  };
}

function buildRiskCustomersQuery({ category, channel }: RiskCustomerFilters) {
  return baseQuery
    .replaceAll("__CHANNEL_FILTER__", filterFor("'gold_fact_transacciones'[canal_movimiento]", channel, "TODOS"))
    .replaceAll("__CATEGORY_FILTER__", filterFor("'gold_fact_transacciones'[categoria]", category, "TODAS"));
}

function filterFor(column: string, value: string, allValue: string) {
  if (value === allValue) return `ALL(${column})`;
  return `TREATAS({"${escapeDaxString(value)}"}, ${column})`;
}

function escapeDaxString(value: string) {
  return value.replace(/"/g, '""');
}
