import { sb } from "../supabase.js";

export async function renderSeparacao() {
  const { data } = await sb
    .from("agendas")
    .select("*")
    .in("status_global", ["Agendado", "Em Separação"]);

  const linhas = data.map(r => `
    <tr>
      <td>${r.dt}</td>
      <td>${r.cliente}</td>
      <td>${r.status_global}</td>
    </tr>
  `).join("");

  document.getElementById("content").innerHTML = `
    <h1>Separação</h1>
    <table>
      ${linhas}
    </table>
  `;
}