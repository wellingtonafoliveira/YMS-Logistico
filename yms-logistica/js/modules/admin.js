import { sb } from "../supabase.js";

export async function renderAdmin() {
  document.getElementById("content").innerHTML = `
    <h1>Admin</h1>
    <button id="btnLimpar">Limpar dados</button>
  `;

  document.getElementById("btnLimpar").onclick = async () => {
    await sb.from("agendas").delete().neq("id", "");
    alert("Dados apagados");
  };
}