import { sb } from "../supabase.js";

export async function renderAgenda() {
  const { data } = await sb.from("agendas").select("*");

  const linhas = data.map(r => `
    <tr>
      <td>${r.dt}</td>
      <td>${r.cliente}</td>
      <td>${r.transportadora}</td>
      <td>${r.status_global}</td>
    </tr>
  `).join("");

  document.getElementById("content").innerHTML = `
    <h1>Agenda</h1>

    <table>
      <tr>
        <th>DT</th>
        <th>Cliente</th>
        <th>Transportadora</th>
        <th>Status</th>
      </tr>
      ${linhas}
    </table>
  `;
}