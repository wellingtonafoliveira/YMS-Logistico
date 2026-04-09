import { sb } from "../supabase.js";

export async function renderDashboard() {
  const { data } = await sb.from("agendas").select("*");

  const total = data.length;
  const expedidos = data.filter(x => x.status_global === "Expedido").length;

  document.getElementById("content").innerHTML = `
    <h1>Dashboard</h1>

    <div class="grid grid-2">
      <div class="card">
        <h3>Total de DTs</h3>
        <div>${total}</div>
      </div>

      <div class="card">
        <h3>Expedidos</h3>
        <div>${expedidos}</div>
      </div>
    </div>
  `;
}
