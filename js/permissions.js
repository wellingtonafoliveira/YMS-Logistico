export function podeCriarDT(perfil) {
  return perfil !== "portaria";
}

export function podeVerAdmin(perfil) {
  return perfil === "admin";
}

export function podeEditar(perfil) {
  return ["admin", "operacao", "assistente"].includes(perfil);
}

export function podeMoverStatus(perfil) {
  return ["admin", "operacao", "conferente"].includes(perfil);
}
