import { sb } from "../supabase.js";

export async function renderCheckin() {
  document.getElementById("content").innerHTML = `
    <h1>Check-in</h1>

    <input id="dt" placeholder="DT">
    <input id="motorista" placeholder="Motorista">
    <button id="btnCheckin">Registrar</button>
  `;

  document.getElementById("btnCheckin").onclick = async () => {
    const dt = document.getElementById("dt").value;
    const motorista = document.getElementById("motorista").value;

    await sb.from("agendas")
      .update({
        motorista,
        status_global: "No Pátio"
      })
      .eq("dt", dt);

    alert("Check-in realizado");
  };
}
