import { sb } from "../supabase.js";

export async function renderRelatorios() {
  const { data } = await sb.from("agendas").select("*");

  const total = data.length;
  const atrasados = data.filter(x => x.status_global !== "Expedido").length;

  document.getElementById("content").innerHTML = `
    <h1>Relatórios</h1>

    <div>Total: ${total}</div>
    <div>Não expedidos: ${atrasados}</div>
  `;
}