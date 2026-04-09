import { login } from "./auth.js";

function init() {
  renderLogin();
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
      alert("Login OK");
    } catch (e) {
      document.getElementById("erro").textContent = e.message;
    }
  };
}

init();
