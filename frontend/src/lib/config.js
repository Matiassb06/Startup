// En desarrollo usa localhost:8000; en producción usa la misma origin (Nginx hace proxy).
// Se puede sobreescribir con VITE_API_BASE en un .env
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
