import React, { useMemo, useState } from "react";
import { CheckCircle2, Filter, PlusCircle } from "lucide-react";

type Kpi = {
  label: string;
  value: string;
  detail: string;
};

type CustomerRisk = {
  customer_id: string;
  canal: "POS" | "ONLINE";
  score: number;
  recencia_dias: number;
  gasto_total: number;
  tasa_devolucion_cliente: number;
  categoria_preferida?: string;
};

type Props = {
  category: string;
  channel: string;
  kpis: Kpi[];
  customers: CustomerRisk[];
  onAddToCampaign: (customer: CustomerRisk) => Promise<void>;
  onCategoryChange: (category: string) => void;
  onChannelChange: (channel: string) => void;
};

export function App({
  category,
  channel,
  kpis,
  customers,
  onAddToCampaign,
  onCategoryChange,
  onChannelChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const visibleCustomers = useMemo(() => {
    return customers
      .filter((customer) => channel === "TODOS" || customer.canal === channel)
      .filter((customer) => category === "TODAS" || customer.categoria_preferida === category)
      .sort((a, b) => a.score - b.score || b.recencia_dias - a.recencia_dias);
  }, [category, channel, customers]);

  async function add(customer: CustomerRisk) {
    await onAddToCampaign(customer);
    setSelected((current) => Array.from(new Set([...current, customer.customer_id])));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>FraSoHome</h1>
          <p>Exploracion gobernada de ventas, devoluciones y clientes en riesgo</p>
        </div>
        <div className="filters" aria-label="Filtros">
          <Filter size={18} />
          <select aria-label="Canal" value={channel} onChange={(event) => onChannelChange(event.target.value)}>
            <option>TODOS</option>
            <option>POS</option>
            <option>ONLINE</option>
          </select>
          <select aria-label="Categoria" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            <option>TODAS</option>
            <option>Decoracion</option>
            <option>Iluminacion</option>
            <option>Muebles</option>
            <option>Textil hogar</option>
          </select>
        </div>
      </header>

      <section className="kpi-grid">
        {kpis.map((kpi) => (
          <article className="kpi" key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </article>
        ))}
      </section>

      <section className="table-section">
        <div className="section-heading">
          <h2>Clientes en riesgo</h2>
          <span>{visibleCustomers.length} clientes</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Canal</th>
              <th>Categoria</th>
              <th>Score</th>
              <th>Recencia</th>
              <th>Gasto</th>
              <th>Tasa devolucion</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {visibleCustomers.map((customer) => {
              const done = selected.includes(customer.customer_id);
              return (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.canal}</td>
                  <td>{customer.categoria_preferida ?? "Sin categoria"}</td>
                  <td>{customer.score}</td>
                  <td>{customer.recencia_dias} dias</td>
                  <td>{formatCurrency(customer.gasto_total)}</td>
                  <td>{formatPercent(customer.tasa_devolucion_cliente)}</td>
                  <td>
                    <button type="button" onClick={() => add(customer)} disabled={done}>
                      {done ? <CheckCircle2 size={18} /> : <PlusCircle size={18} />}
                      {done ? "En campaña" : "Anadir"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {visibleCustomers.length === 0 ? (
              <tr>
                <td colSpan={8}>No hay clientes para los filtros seleccionados.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 }).format(value);
}
