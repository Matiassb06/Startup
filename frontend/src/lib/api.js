/**
 * api.js — Wrapper de fetch con JWT automático para Train-to-Hire.
 *
 * Uso:
 *   import { api } from "../lib/api";
 *   const data = await api.get("/student/opportunities");
 *   const data = await api.post("/student/apply", { opportunity_id: 1 });
 */

import { API_BASE } from "./config";
import { getToken, clearSession } from "./session";

async function request(method, path, body = null) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);

  // Si el token expiró o es inválido, limpiar sesión y redirigir
  if (response.status === 401) {
    clearSession();
    window.location.href = "/login";
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.detail || `Error ${response.status}`;
    const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};
