import { useState } from "react";

import { App as FrasoHomeApp } from "./app/App";
import { useSemanticModelQuery } from "./hooks/use-semantic-model-query";
import { getRayfinClient } from "./lib/rayfin-client";
import { frasohomeKpis, frasohomeRiskCustomers, KPI_COLUMNS, RISK_CUSTOMER_COLUMNS } from "./queries";

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

function App() {
  const [channel, setChannel] = useState("TODOS");
  const [category, setCategory] = useState("TODAS");
  const kpiQuery = frasohomeKpis({ category, channel });
  const customersQuery = frasohomeRiskCustomers({ category, channel });
  const { data: kpiData, isLoading: kpisLoading, error: kpisError } = useSemanticModelQuery({
    connection: kpiQuery.connection,
    query: kpiQuery.query,
    bypassCache: true,
  });
  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useSemanticModelQuery({
    connection: customersQuery.connection,
    query: customersQuery.query,
    bypassCache: true,
  });
  const kpis = buildKpis(kpiData, kpisLoading, kpisError);
  const customers = buildCustomers(customersData);

  return (
    <FrasoHomeApp
      category={category}
      channel={channel}
      customersError={customersError}
      customersLoading={customersLoading}
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

function buildCustomers(data: ReturnType<typeof useSemanticModelQuery>["data"]): CustomerRisk[] {
  if (data?.status !== "success") return [];

  const columns = data.table.columns.map((column) => column.name);

  function valueFor(row: unknown[], columnName: string) {
    const index = columns.indexOf(columnName);
    return index >= 0 ? row[index] : undefined;
  }

  return data.table.rows.flatMap((row) => {
    const customerId = asString(valueFor(row, RISK_CUSTOMER_COLUMNS.customerId));
    const channel = asChannel(valueFor(row, RISK_CUSTOMER_COLUMNS.channel));
    const score = asNumber(valueFor(row, RISK_CUSTOMER_COLUMNS.score));
    const recencyDays = asNumber(valueFor(row, RISK_CUSTOMER_COLUMNS.recencyDays));
    const totalSpend = asNumber(valueFor(row, RISK_CUSTOMER_COLUMNS.totalSpend));
    const returnRate = asNumber(valueFor(row, RISK_CUSTOMER_COLUMNS.returnRate));

    if (!customerId || !channel || score == null || recencyDays == null || totalSpend == null || returnRate == null) {
      return [];
    }

    return [
      {
        customer_id: customerId,
        canal: channel,
        score,
        recencia_dias: recencyDays,
        gasto_total: totalSpend,
        tasa_devolucion_cliente: returnRate,
        categoria_preferida: asString(valueFor(row, RISK_CUSTOMER_COLUMNS.preferredCategory)),
      },
    ];
  });
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asChannel(value: unknown): CustomerRisk["canal"] | undefined {
  return value === "POS" || value === "ONLINE" ? value : undefined;
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
