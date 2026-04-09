import { login, getSession } from "./auth.js";

import { renderDashboard } from "./modules/dashboard.js";
import { renderAgenda } from "./modules/agenda.js";
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
        <div class="brand">
          <h2>YMS</h2>
          <span>Gestão Logística</span>
        </div>

        <div class="menu">
          <button onclick="loadPage('dashboard')">Dashboard</button>
          <button onclick="loadPage('agenda')">Agenda</button>
          <button onclick="loadPage('separacao')">Separação</button>
          <button onclick="loadPage('expedicao')">Expedição</button>
          <button onclick="loadPage('patio')">Pátio</button>
          <button onclick="loadPage('docas')">Docas</button>
          <button onclick="loadPage('checkin')">Check-in</button>
          <button onclick="loadPage('relatorios')">Relatórios</button>
          <button onclick="loadPage('admin')">Admin</button>
        </div>
      </aside>

      <main class="main">

        <div class="topbar">
          <div>
            <h1 id="pageTitle">Dashboard</h1>
            <p>Controle operacional em tempo real</p>
          </div>
        </div>

        <div id="content"></div>

      </main>
    </div>
  `;

  // controle de páginas
  window.loadPage = (page) => {
    const map = {
      dashboard: renderDashboard,
      agenda: renderAgenda,
      separacao: renderSeparacao,
      expedicao: renderExpedicao,
      patio: renderPatio,
      docas: renderDocas,
      checkin: renderCheckin,
      relatorios: renderRelatorios,
      admin: renderAdmin
    };

    document.getElementById("pageTitle").textContent =
      page.charAt(0).toUpperCase() + page.slice(1);

    map[page]();
  };

  loadPage("dashboard");
}
