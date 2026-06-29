import { App as FrasoHomeApp } from "./app/App";
import { getRayfinClient } from "./lib/rayfin-client";

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

const kpis = [
  { label: "Ventas netas", value: "1,79 M EUR", detail: "Gold fact transacciones" },
  { label: "Margen bruto", value: "648 k EUR", detail: "Medida gobernada" },
  { label: "Tasa devolucion", value: "7,6 %", detail: "Sobre ventas netas" },
  { label: "Clientes en riesgo", value: "94", detail: "Score de reactivacion" },
];

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
  return <FrasoHomeApp kpis={kpis} customers={customers} onAddToCampaign={addToCampaign} />;
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

export default App;
