import { sb } from "../supabase.js";

export async function renderExpedicao() {
  const { data } = await sb
    .from("agendas")
    .select("*")
    .in("status_global", ["Separado", "Pronto Expedição"]);

  document.getElementById("content").innerHTML = `
    <h1>Expedição</h1>
    <div>Total: ${data.length}</div>
  `;
}