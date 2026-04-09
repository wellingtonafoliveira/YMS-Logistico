import { getSession } from "./auth.js";
import { renderDashboard } from "./modules/dashboard.js";

async function init() {
  try {
    const session = await getSession();

    if (!session) {
      renderLogin();
      return;
    }

    renderApp();

  } catch (e) {
    console.error("Erro:", e);
    document.getElementById("app").innerHTML =
      "<h2>Erro ao iniciar sistema</h2>";
  }
}

function renderLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login-screen">
      <div class="login-box">
        <h2>Login</h2>
        <input placeholder="Email">
        <input placeholder="Senha">
        <button>Entrar</button>
      </div>
    </div>
  `;
}

function renderApp() {
  document.getElementById("app").innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <h2>YMS</h2>
      </aside>

      <main class="main">
        <div id="content"></div>
      </main>
    </div>
  `;

  renderDashboard();
}

init();
