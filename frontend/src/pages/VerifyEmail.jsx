import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/config";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no proporcionado.");
      return;
    }

    fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Correo verificado exitosamente.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Token inválido o expirado.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Error de conexión. Intenta de nuevo.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-zinc-300">Verificando tu correo...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¡Correo verificado!</h2>
            <p className="text-zinc-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Error de verificación</h2>
            <p className="text-zinc-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
