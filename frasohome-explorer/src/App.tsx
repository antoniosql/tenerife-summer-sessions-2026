import { useState } from "react";

import { App as FrasoHomeApp } from "./app/App";
import { useSemanticModelQuery } from "./hooks/use-semantic-model-query";
import { getRayfinClient } from "./lib/rayfin-client";
import { frasohomeKpis, KPI_COLUMNS } from "./queries";

import "./app/styles.css";

type CustomerRisk = {
  customer_id: string;
  canal: "POS" | "ONLINE";
  score: number;
  recencia_dias: number;
  gasto_total: number;
  tasa_devolucion_cliente: number;
  categoria_preferida?: string;
};

const customers: CustomerRisk[] = [
  {
    customer_id: "C0061",
    canal: "ONLINE",
    score: 18,
    recencia_dias: 211,
    gasto_total: 5119,
    tasa_devolucion_cliente: 0.214,
    categoria_preferida: "Iluminacion",
  },
  {
    customer_id: "C0038",
    canal: "POS",
    score: 23,
    recencia_dias: 184,
    gasto_total: 4584,
    tasa_devolucion_cliente: 0.167,
    categoria_preferida: "Muebles",
  },
  {
    customer_id: "C0027",
    canal: "ONLINE",
    score: 29,
    recencia_dias: 156,
    gasto_total: 3375,
    tasa_devolucion_cliente: 0.192,
    categoria_preferida: "Decoracion",
  },
  {
    customer_id: "C0073",
    canal: "ONLINE",
    score: 33,
    recencia_dias: 142,
    gasto_total: 2890,
    tasa_devolucion_cliente: 0.083,
    categoria_preferida: "Textil hogar",
  },
  {
    customer_id: "C0045",
    canal: "POS",
    score: 36,
    recencia_dias: 131,
    gasto_total: 3303,
    tasa_devolucion_cliente: 0.071,
    categoria_preferida: "Muebles",
  },
];

function App() {
  const [channel, setChannel] = useState("TODOS");
  const [category, setCategory] = useState("TODAS");
  const kpiQuery = frasohomeKpis({ category, channel });
  const { data, isLoading, error } = useSemanticModelQuery({
    connection: kpiQuery.connection,
    query: kpiQuery.query,
    bypassCache: true,
  });
  const kpis = buildKpis(data, isLoading, error);

  return (
    <FrasoHomeApp
      category={category}
      channel={channel}
      kpis={kpis}
      customers={customers}
      onAddToCampaign={addToCampaign}
      onCategoryChange={setCategory}
      onChannelChange={setChannel}
    />
  );
}

async function addToCampaign(customer: CustomerRisk) {
  try {
    const client = getRayfinClient();
    const session = client.auth.getSession();

    if (!session.isAuthenticated) {
      throw new Error("No hay sesion autenticada de Rayfin.");
    }

    await client.data.ReactivacionCliente.create({
      customer_id: customer.customer_id,
      score: customer.score,
      recencia_dias: customer.recencia_dias,
      categoria_preferida: customer.categoria_preferida ?? "Sin categoria",
      oferta_sugerida: suggestOffer(customer),
      en_campania: true,
      creado_el: new Date(),
    });
  } catch (error) {
    console.warn("No se pudo persistir la accion en Rayfin; se mantiene el estado visual.", error);
  }
}

function suggestOffer(customer: CustomerRisk) {
  if (customer.categoria_preferida === "Muebles") return "10% en montaje y envio premium";
  if (customer.categoria_preferida === "Iluminacion") return "Pack iluminacion con envio gratuito";
  if (customer.categoria_preferida === "Textil hogar") return "Renovacion textil con descuento VIP";
  return "Campania de reactivacion personalizada";
}

function buildKpis(
  data: ReturnType<typeof useSemanticModelQuery>["data"],
  isLoading: boolean,
  error: Error | undefined,
) {
  const unavailable = error ? "Error" : isLoading ? "..." : "N/D";
  const row = data?.status === "success" ? data.table.rows[0] : undefined;
  const columns = data?.status === "success" ? data.table.columns.map((column) => column.name) : [];

  function valueFor(columnName: string) {
    if (!row) return undefined;
    const index = columns.indexOf(columnName);
    return index >= 0 ? row[index] : undefined;
  }

  const ventasNetas = asNumber(valueFor(KPI_COLUMNS.ventasNetas));
  const margenBruto = asNumber(valueFor(KPI_COLUMNS.margenBruto));
  const tasaDevolucion = asNumber(valueFor(KPI_COLUMNS.tasaDevolucion));
  const clientesEnRiesgo = asNumber(valueFor(KPI_COLUMNS.clientesEnRiesgo));

  return [
    {
      label: "Ventas netas",
      value: ventasNetas == null ? unavailable : formatCompactCurrency(ventasNetas),
      detail: "Modelo semantico",
    },
    {
      label: "Margen bruto",
      value: margenBruto == null ? unavailable : formatCompactCurrency(margenBruto),
      detail: "Medida gobernada",
    },
    {
      label: "Tasa devolucion",
      value: tasaDevolucion == null ? unavailable : formatPercentValue(tasaDevolucion),
      detail: "Sobre ventas netas",
    },
    {
      label: "Clientes en riesgo",
      value: clientesEnRiesgo == null ? unavailable : formatInteger(clientesEnRiesgo),
      detail: "Score de reactivacion",
    },
  ];
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    currency: "EUR",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatPercentValue(value: number) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}

export default App;
