import { sb } from "../supabase.js";

export async function renderPatio() {
  const { data } = await sb
    .from("agendas")
    .select("*")
    .in("status_global", ["No Pátio", "Em Doca"]);

  document.getElementById("content").innerHTML = `
    <h1>Pátio</h1>
    <div>Veículos no pátio: ${data.length}</div>
  `;
}
