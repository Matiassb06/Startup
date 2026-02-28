/**
 * session.js — Gestión de sesión con JWT para Train-to-Hire.
 *
 * Almacena el token y datos del usuario en localStorage.
 * Provee helpers para leer, escribir y limpiar la sesión.
 */

const SESSION_KEY = "tth_session";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function mergeSession(partial) {
  const current = getSession() || {};
  const merged = { ...current, ...partial };
  setSession(merged);
  return merged;
}

/** Devuelve el JWT token o null. */
export function getToken() {
  const session = getSession();
  return session?.access_token || null;
}

/** Devuelve true si hay un token almacenado. */
export function isAuthenticated() {
  return !!getToken();
}
