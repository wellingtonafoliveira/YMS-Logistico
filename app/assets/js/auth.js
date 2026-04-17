const YMS_LOCK_KEY = "glp_login_lock_v2";
const YMS_AUTH_CACHE_KEY = "glp_auth_profile_v2";
const YMS_MAX_FREE_ATTEMPTS = 2;
const YMS_DEFAULT_REDIRECT_LOGIN = "login.html";
const YMS_DEFAULT_REDIRECT_APP = "app.html";

function ymsNow(){
  return Date.now();
}

function ymsNormalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function ymsReadLockState(){
  try {
    return JSON.parse(localStorage.getItem(YMS_LOCK_KEY) || "{}");
  } catch (_) {
    return {};
  }
}

function ymsWriteLockState(state){
  localStorage.setItem(YMS_LOCK_KEY, JSON.stringify(state || {}));
}

function ymsGetLockEntry(email){
  const state = ymsReadLockState();
  const key = ymsNormalizeEmail(email) || "__global__";
  const entry = state[key] || { attempts: 0, lockedUntil: 0, lastAttemptAt: 0 };
  if(entry.lockedUntil && entry.lockedUntil < ymsNow()){
    entry.lockedUntil = 0;
    if(entry.attempts > YMS_MAX_FREE_ATTEMPTS) entry.attempts = YMS_MAX_FREE_ATTEMPTS;
    state[key] = entry;
    ymsWriteLockState(state);
  }
  return entry;
}

function ymsSetLockEntry(email, entry){
  const state = ymsReadLockState();
  const key = ymsNormalizeEmail(email) || "__global__";
  state[key] = entry;
  ymsWriteLockState(state);
}

function ymsClearLockEntry(email){
  const state = ymsReadLockState();
  const key = ymsNormalizeEmail(email) || "__global__";
  delete state[key];
  ymsWriteLockState(state);
}

function ymsCooldownMs(attempts){
  if(attempts <= YMS_MAX_FREE_ATTEMPTS) return 0;
  if(attempts === 3) return 30_000;
  if(attempts === 4) return 60_000;
  return 5 * 60_000;
}

function ymsFormatRemaining(ms){
  const total = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  if(min > 0 && sec > 0) return `${min}min ${sec}s`;
  if(min > 0) return `${min}min`;
  return `${sec}s`;
}

function ymsSetMessage(message, type = "error"){
  const el = document.getElementById("loginErro");
  if(!el) return;
  el.textContent = message || "";
  el.dataset.type = type;
}

function ymsSetStatus(message){
  const el = document.getElementById("loginStatus");
  if(!el) return;
  el.textContent = message || "";
}

function ymsUpdateAttemptBadge(email){
  const badge = document.getElementById("loginAttemptBadge");
  if(!badge) return;
  const entry = ymsGetLockEntry(email);
  if(entry.lockedUntil && entry.lockedUntil > ymsNow()){
    badge.textContent = `Proteção ativa • tente novamente em ${ymsFormatRemaining(entry.lockedUntil - ymsNow())}`;
    return;
  }
  const used = Math.max(0, entry.attempts);
  badge.textContent = used > 0 ? `Tentativas recentes: ${used}` : "Proteção ativa no login";
}

let ymsLockTimer = null;
function ymsRefreshLoginProtection(email){
  const submitBtn = document.getElementById("loginSubmitBtn");
  const recoverBtn = document.getElementById("loginRecoverBtn");
  const entry = ymsGetLockEntry(email);
  const remaining = (entry.lockedUntil || 0) - ymsNow();
  if(ymsLockTimer){
    clearTimeout(ymsLockTimer);
    ymsLockTimer = null;
  }
  const locked = remaining > 0;
  if(submitBtn){
    submitBtn.disabled = locked;
    submitBtn.textContent = locked ? `Aguarde ${ymsFormatRemaining(remaining)}` : "Entrar com segurança";
  }
  if(recoverBtn) recoverBtn.disabled = locked;
  ymsUpdateAttemptBadge(email);
  if(locked){
    ymsSetStatus(`Muitas tentativas. O acesso foi pausado por ${ymsFormatRemaining(remaining)}.`);
    ymsLockTimer = setTimeout(() => ymsRefreshLoginProtection(email), 1000);
  } else if(document.getElementById("loginStatus")?.textContent?.includes("Muitas tentativas")){
    ymsSetStatus("Acesso interno protegido por sessão, perfil e bloqueio progressivo.");
  }
}

function ymsPersistProfile(profile){
  try {
    sessionStorage.setItem(YMS_AUTH_CACHE_KEY, JSON.stringify(profile || null));
  } catch (_) {}
}

function ymsReadPersistedProfile(){
  try {
    return JSON.parse(sessionStorage.getItem(YMS_AUTH_CACHE_KEY) || "null");
  } catch (_) {
    return null;
  }
}

async function ymsLoadProfileFromDatabase(session){
  const email = ymsNormalizeEmail(session?.user?.email || "");
  const userId = session?.user?.id || null;
  let data = null;
  let error = null;

  try {
    if(userId){
      const byId = await sb.from("usuarios").select("id,nome,email,perfil,ativo").eq("id", userId).maybeSingle();
      if(byId.error) error = byId.error;
      if(byId.data) data = byId.data;
    }
    if(!data && email){
      const byEmail = await sb.from("usuarios").select("id,nome,email,perfil,ativo").eq("email", email).maybeSingle();
      if(byEmail.error) error = byEmail.error;
      if(byEmail.data) data = byEmail.data;
    }
  } catch (err) {
    error = err;
  }

  if(error) throw error;
  if(!data) return { ok: false, reason: "no_profile" };
  if(data.ativo !== true) return { ok: false, reason: "inactive", profile: data };

  const perfil = String(data.perfil || "").trim().toLowerCase();
  const allowed = Array.isArray(window.YMS_ALLOWED_ROLES) ? window.YMS_ALLOWED_ROLES : [];
  if(perfil && allowed.length && !allowed.includes(perfil)){
    return { ok: false, reason: "role_blocked", profile: data };
  }

  return {
    ok: true,
    profile: {
      ...data,
      perfil,
      email: ymsNormalizeEmail(data.email || email),
      nome: data.nome || session?.user?.email || "Usuário"
    }
  };
}

async function ymsValidateSessionProfile(session){
  if(!session?.user) return { ok: false, reason: "no_session" };
  try {
    const result = await ymsLoadProfileFromDatabase(session);
    if(result.ok) ymsPersistProfile(result.profile);
    return result;
  } catch (error) {
    console.error("Falha ao validar perfil:", error);
    return { ok: false, reason: "profile_unavailable", error };
  }
}

async function ymsEnforceSession(options = {}){
  const redirectTo = options.redirectTo || YMS_DEFAULT_REDIRECT_LOGIN;
  const { data } = await sb.auth.getSession();
  const session = data?.session || null;
  if(!session){
    if(options.redirect !== false) window.location.href = redirectTo;
    return null;
  }

  const validation = await ymsValidateSessionProfile(session);
  if(!validation.ok){
    await sb.auth.signOut();
    ymsPersistProfile(null);
    if(options.redirect !== false) window.location.href = `${redirectTo}?motivo=${encodeURIComponent(validation.reason || "unauthorized")}`;
    return null;
  }

  window.YMS_AUTH_PROFILE = validation.profile;
  return { session, profile: validation.profile };
}

async function loginYMS(){
  const emailEl = document.getElementById("loginEmail");
  const senhaEl = document.getElementById("loginSenha");
  const email = ymsNormalizeEmail(emailEl?.value || "");
  const senha = senhaEl?.value || "";

  ymsSetMessage("");
  ymsRefreshLoginProtection(email);

  if(!email || !senha){
    ymsSetMessage("Informe email e senha.");
    return null;
  }

  const entry = ymsGetLockEntry(email);
  if(entry.lockedUntil && entry.lockedUntil > ymsNow()){
    ymsSetMessage(`Muitas tentativas. Aguarde ${ymsFormatRemaining(entry.lockedUntil - ymsNow())}.`);
    ymsRefreshLoginProtection(email);
    return null;
  }

  const submitBtn = document.getElementById("loginSubmitBtn");
  if(submitBtn){
    submitBtn.disabled = true;
    submitBtn.textContent = "Validando acesso...";
  }
  ymsSetStatus("Conferindo credenciais e perfil de acesso...");

  const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });

  if(error || !data?.session){
    const attempts = (entry.attempts || 0) + 1;
    const lockedUntil = ymsNow() + ymsCooldownMs(attempts);
    ymsSetLockEntry(email, { attempts, lockedUntil, lastAttemptAt: ymsNow() });
    ymsSetMessage("Credenciais inválidas.");
    ymsSetStatus("Falha de autenticação registrada com proteção progressiva.");
    ymsRefreshLoginProtection(email);
    return null;
  }

  const validation = await ymsValidateSessionProfile(data.session);
  if(!validation.ok){
    await sb.auth.signOut();
    const attempts = (entry.attempts || 0) + 1;
    const lockedUntil = ymsNow() + ymsCooldownMs(attempts);
    ymsSetLockEntry(email, { attempts, lockedUntil, lastAttemptAt: ymsNow() });
    ymsSetMessage("Acesso não autorizado.");
    ymsSetStatus("O usuário autenticou, mas o perfil não foi liberado para o sistema.");
    ymsRefreshLoginProtection(email);
    return null;
  }

  ymsClearLockEntry(email);
  ymsPersistProfile(validation.profile);
  ymsSetStatus("Sessão validada. Redirecionando para o sistema...");
  window.location.href = YMS_DEFAULT_REDIRECT_APP;
  return { session: data.session, profile: validation.profile };
}

async function logoutYMS(){
  try {
    await sb.auth.signOut();
  } finally {
    ymsPersistProfile(null);
    window.location.href = YMS_DEFAULT_REDIRECT_LOGIN;
  }
}

async function requireAuthYMS(){
  return ymsEnforceSession({ redirectTo: YMS_DEFAULT_REDIRECT_LOGIN, redirect: true });
}

async function redirectIfLoggedInYMS(){
  const auth = await ymsEnforceSession({ redirectTo: YMS_DEFAULT_REDIRECT_LOGIN, redirect: false });
  if(auth && window.location.pathname.endsWith("/login.html")){
    window.location.href = YMS_DEFAULT_REDIRECT_APP;
    return true;
  }
  return false;
}

async function recoverPasswordYMS(){
  const email = ymsNormalizeEmail(document.getElementById("loginEmail")?.value || "");
  if(!email){
    ymsSetMessage("Informe o email corporativo para recuperar a senha.");
    return;
  }
  const recoverBtn = document.getElementById("loginRecoverBtn");
  if(recoverBtn) recoverBtn.disabled = true;
  try {
    const redirectTo = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}login.html`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if(error) throw error;
    ymsSetMessage("Se o email estiver autorizado, o link de redefinição será enviado.", "success");
  } catch (error) {
    console.error(error);
    ymsSetMessage("Não foi possível iniciar a recuperação agora.");
  } finally {
    if(recoverBtn) recoverBtn.disabled = false;
  }
}

window.loginYMS = loginYMS;
window.logoutYMS = logoutYMS;
window.requireAuthYMS = requireAuthYMS;
window.redirectIfLoggedInYMS = redirectIfLoggedInYMS;
window.recoverPasswordYMS = recoverPasswordYMS;
window.login = loginYMS;
window.logout = logoutYMS;

document.addEventListener("DOMContentLoaded", async () => {
  const isLoginPage = window.location.pathname.endsWith("/login.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/index.html");
  if(!isLoginPage) return;

  ymsSetStatus("Acesso interno protegido por sessão, perfil e bloqueio progressivo.");
  const emailEl = document.getElementById("loginEmail");
  const senhaEl = document.getElementById("loginSenha");
  await redirectIfLoggedInYMS();
  ymsRefreshLoginProtection(emailEl?.value || "");

  const submitIfEnter = (e) => {
    if(e.key === "Enter"){
      e.preventDefault();
      loginYMS();
    }
  };

  emailEl?.addEventListener("keydown", submitIfEnter);
  senhaEl?.addEventListener("keydown", submitIfEnter);
  emailEl?.addEventListener("input", () => {
    ymsSetMessage("");
    ymsRefreshLoginProtection(emailEl.value);
  });
  document.getElementById("loginRecoverBtn")?.addEventListener("click", recoverPasswordYMS);
  document.getElementById("loginSubmitBtn")?.addEventListener("click", loginYMS);

  const motivo = new URLSearchParams(window.location.search).get("motivo");
  if(motivo === "no_profile") ymsSetMessage("Acesso não autorizado.");
  if(motivo === "inactive") ymsSetMessage("Acesso não autorizado.");
  if(motivo === "role_blocked") ymsSetMessage("Acesso não autorizado.");
  if(motivo === "unauthorized") ymsSetMessage("Sua sessão expirou.");
});
