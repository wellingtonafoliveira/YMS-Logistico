import { sb } from "../supabase.js";

export async function renderDocas() {
  const { data } = await sb
    .from("agendas")
    .select("*")
    .in("status_global", ["Em Doca", "Em Carregamento"]);

  document.getElementById("content").innerHTML = `
    <h1>Docas</h1>
    <div>Docas ocupadas: ${data.length}</div>
  `;
}
