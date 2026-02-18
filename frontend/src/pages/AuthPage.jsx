import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { API_BASE } from "../lib/config";
import { setSession } from "../lib/session";

function roleToDashboard(role) {
  if (role === "company") return "/company/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => (mode === "register" ? "Crear Cuenta" : "Iniciar Sesión"), [mode]);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Ingresa un correo válido." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password_hash: "demo_auth_profile",
          role,
          profile_data: { source: mode },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear/iniciar el perfil.");
      }

      const payload = await response.json();
      const userId = payload.user_id ?? payload.id;
      setSession({ role, userId, email: email.trim().toLowerCase() });

      const target = location.state?.from && location.state.from !== "/login" ? location.state.from : roleToDashboard(role);
      navigate(target, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al autenticar.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const adminDemo = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@train.com",
          password_hash: "demo_admin",
          role: "admin",
          profile_data: { source: "admin_demo" },
        }),
      });
      if (!response.ok) throw new Error("No se pudo iniciar modo admin.");
      const payload = await response.json();
      setSession({ role: "admin", userId: payload.user_id ?? payload.id, email: "admin@train.com" });
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error admin demo." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">Accede a tu panel según tu rol dentro de Train-to-Hire.</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Rol</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
            >
              <option value="student">Estudiante</option>
              <option value="company">Empresa</option>
            </select>
          </div>

          {status.message ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{status.message}</div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-70"
          >
            {mode === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {submitting ? "Procesando..." : title}
          </button>
        </form>

        <button
          type="button"
          onClick={adminDemo}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-indigo-400/60"
        >
          <ShieldCheck className="h-4 w-4" />
          Acceso Admin Demo
        </button>

        <p className="mt-4 text-center text-sm text-zinc-400">
          {mode === "register" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"} {" "}
          <Link to={mode === "register" ? "/login" : "/register"} className="text-indigo-300 hover:text-indigo-200">
            {mode === "register" ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
    </div>
  );
}
