import { sb } from "./supabase.js";

export async function login(email, senha) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    throw new Error("Email ou senha inválidos");
  }

  return data.user;
}

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function logout() {
  await sb.auth.signOut();
}
