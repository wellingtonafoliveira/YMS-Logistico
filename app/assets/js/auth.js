async function loginYMS(){
  const email = document.getElementById("loginEmail")?.value.trim() || "";
  const senha = document.getElementById("loginSenha")?.value || "";
  const erroEl = document.getElementById("loginErro");
  if(erroEl) erroEl.textContent = "";

  if(!email || !senha){
    if(erroEl) erroEl.textContent = "Informe email e senha.";
    return null;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
  if(error){
    if(erroEl) erroEl.textContent = error.message || "Email ou senha inválidos.";
    return null;
  }

  window.location.href = "app.html";
  return data;
}

async function logoutYMS(){
  await sb.auth.signOut();
  window.location.href = "login.html";
}

async function requireAuthYMS(){
  const { data } = await sb.auth.getSession();
  if(!data.session){
    if(!window.location.pathname.endsWith("/login.html")){
      window.location.href = "login.html";
    }
    return null;
  }
  return data.session;
}

async function redirectIfLoggedInYMS(){
  const { data } = await sb.auth.getSession();
  if(data.session && window.location.pathname.endsWith("/login.html")){
    window.location.href = "app.html";
    return true;
  }
  return false;
}

window.loginYMS = loginYMS;
window.logoutYMS = logoutYMS;
window.requireAuthYMS = requireAuthYMS;
window.login = loginYMS;
window.logout = logoutYMS;

document.addEventListener("DOMContentLoaded", async () => {
  const isLoginPage = window.location.pathname.endsWith("/login.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/index.html");
  if(isLoginPage){
    await redirectIfLoggedInYMS();

    const emailEl = document.getElementById("loginEmail");
    const senhaEl = document.getElementById("loginSenha");
    const submitIfEnter = (e) => {
      if(e.key === "Enter"){
        e.preventDefault();
        loginYMS();
      }
    };
    emailEl?.addEventListener("keydown", submitIfEnter);
    senhaEl?.addEventListener("keydown", submitIfEnter);
  }
});
