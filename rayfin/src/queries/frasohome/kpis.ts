import type { ColumnMetadataMap } from "@/lib/to-data-table";

import baseQuery from "./kpis.dax?raw";

export const KPI_COLUMNS = {
  ventasNetas: "[Ventas netas]",
  margenBruto: "[Margen bruto]",
  tasaDevolucion: "[Tasa devolucion]",
  clientesEnRiesgo: "[Clientes en riesgo]",
} as const;

export const kpiColumnMetadata: ColumnMetadataMap = {
  "[Ventas netas]": { name: "Ventas netas", displayName: "Ventas netas", format: "#,##0 EUR" },
  "[Margen bruto]": { name: "Margen bruto", displayName: "Margen bruto", format: "#,##0 EUR" },
  "[Tasa devolucion]": { name: "Tasa devolucion", displayName: "Tasa devolucion", format: "0.0%" },
  "[Clientes en riesgo]": { name: "Clientes en riesgo", displayName: "Clientes en riesgo", format: "#,##0" },
};

type KpiFilters = {
  category: string;
  channel: string;
};

export function frasohomeKpis(filters: KpiFilters) {
  return {
    connection: "frasohomeModel",
    query: buildKpiQuery(filters),
    columnMetadata: kpiColumnMetadata,
  };
}

function buildKpiQuery({ category, channel }: KpiFilters) {
  return baseQuery
    .replace("__CHANNEL_FILTER__", filterFor("gold_fact_transacciones[canal_movimiento]", channel, "TODOS"))
    .replace("__CATEGORY_FILTER__", filterFor("gold_fact_transacciones[categoria]", category, "TODAS"));
}

function filterFor(column: string, value: string, allValue: string) {
  if (value === allValue) return `ALL(${column})`;
  return `TREATAS({"${escapeDaxString(value)}"}, ${column})`;
}

function escapeDaxString(value: string) {
  return value.replace(/"/g, '""');
}
