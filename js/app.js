import { login, getSession } from "./auth.js";

import { renderDashboard } from "./modules/dashboard.js";
import { renderAgenda } from "./modules/agendas.js";
import { renderSeparacao } from "./modules/separacao.js";
import { renderExpedicao } from "./modules/expedicao.js";
import { renderPatio } from "./modules/patio.js";
import { renderDocas } from "./modules/docas.js";
import { renderCheckin } from "./modules/checkin.js";
import { renderRelatorios } from "./modules/relatorios.js";
import { renderAdmin } from "./modules/admin.js";

async function init() {
  const session = await getSession();

  if (!session) {
    renderLogin();
  } else {
    renderApp();
  }
}

function renderLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login-screen">
      <div class="login-box">
        <h2>Login</h2>

        <input id="email" placeholder="Email">
        <input id="senha" type="password" placeholder="Senha">

        <button id="btnLogin" class="btn btn-primary">Entrar</button>

        <div id="erro" style="color:red;"></div>
      </div>
    </div>
  `;

  document.getElementById("btnLogin").onclick = async () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      await login(email, senha);
      location.reload(); // 🔥 AGORA ELE ENTRA NO SISTEMA
    } catch (e) {
      document.getElementById("erro").textContent = e.message;
    }
  };
}

function renderApp() {
  document.getElementById("app").innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <h2>YMS</h2>

        <div class="menu">
          <button id="btnDashboard">Dashboard</button>
          <button id="btnAgenda">Agenda</button>
          <button id="btnSeparacao">Separação</button>
          <button id="btnExpedicao">Expedição</button>
          <button id="btnPatio">Pátio</button>
          <button id="btnDocas">Docas</button>
          <button id="btnCheckin">Check-in</button>
          <button id="btnRelatorios">Relatórios</button>
          <button id="btnAdmin">Admin</button>
        </div>
      </aside>

      <main class="main">
        <div id="content"></div>
      </main>
    </div>
  `;

  // navegação
  document.getElementById("btnDashboard").onclick = renderDashboard;
  document.getElementById("btnAgenda").onclick = renderAgenda;
  document.getElementById("btnSeparacao").onclick = renderSeparacao;
  document.getElementById("btnExpedicao").onclick = renderExpedicao;
  document.getElementById("btnPatio").onclick = renderPatio;
  document.getElementById("btnDocas").onclick = renderDocas;
  document.getElementById("btnCheckin").onclick = renderCheckin;
  document.getElementById("btnRelatorios").onclick = renderRelatorios;
  document.getElementById("btnAdmin").onclick = renderAdmin;

  renderDashboard(); // inicial
}

init();
