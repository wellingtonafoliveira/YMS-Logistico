import { getSession, login } from "./auth.js";
import { renderDashboard } from "./modules/dashboard.js";

async function init() {
  const session = await getSession();

  if (!session) {
    renderLogin();
    return;
  }

  renderApp();
}

function renderLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login-screen">
      <div class="login-box">
        <h2>Login</h2>
        <input id="email" placeholder="Email">
        <input id="senha" type="password" placeholder="Senha">
        <button id="btnLogin">Entrar</button>
        <div id="erro"></div>
      </div>
    </div>
  `;

  document.getElementById("btnLogin").onclick = async () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      await login(email, senha);
      location.reload();
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
        <button id="btnDashboard">Dashboard</button>
        <button id="btnAgenda">Agenda</button>
      </aside>

      <main class="main">
        <div id="content"></div>
      </main>
    </div>
  `;

  // navegação
  document.getElementById("btnDashboard").onclick = () => renderDashboard();

  // inicia dashboard
  renderDashboard();
}

init();