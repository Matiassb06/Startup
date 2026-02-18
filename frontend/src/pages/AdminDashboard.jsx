import { BookCheck, CheckCircle2, LogOut, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE } from "../lib/config";
import { clearSession, getSession, mergeSession } from "../lib/session";

export function AdminDashboard() {
  const [adminId, setAdminId] = useState(null);
  const [pending, setPending] = useState([]);
  const [courseDraft, setCourseDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  const loadPending = async (id) => {
    const response = await fetch(`${API_BASE}/admin/opportunities/pending?admin_id=${id}`);
    if (!response.ok) throw new Error("No se pudieron cargar pendientes.");
    const payload = await response.json();
    setPending(Array.isArray(payload) ? payload : []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const current = getSession();
        const email = current?.email || "admin@train.com";
        const response = await fetch(`${API_BASE}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password_hash: "demo_admin_profile",
            role: "admin",
            profile_data: { source: "admin_dashboard" },
          }),
        });
        if (!response.ok) throw new Error("No se pudo inicializar perfil admin.");
        const payload = await response.json();
        const resolvedId = payload.user_id ?? payload.id;
        mergeSession({ role: "admin", userId: resolvedId, email });
        setAdminId(resolvedId);
        await loadPending(resolvedId);
      } catch (error) {
        setStatus({ type: "error", message: error instanceof Error ? error.message : "Error inesperado." });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const saveCourse = async (opportunityId) => {
    if (!adminId) return;
    const contentUrl = (courseDraft[opportunityId] || "").trim();
    if (!contentUrl) {
      setStatus({ type: "error", message: "Debes ingresar URL del curso." });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/opportunities/${opportunityId}/course`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, content_url: contentUrl, quiz_data: {} }),
      });
      if (!response.ok) throw new Error("No se pudo guardar curso.");
      setStatus({ type: "success", message: "Curso asociado correctamente." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error guardando curso." });
    }
  };

  const publish = async (opportunityId) => {
    if (!adminId) return;
    try {
      const response = await fetch(`${API_BASE}/admin/opportunities/${opportunityId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });
      if (!response.ok) throw new Error("No se pudo publicar la oportunidad.");
      await loadPending(adminId);
      setStatus({ type: "success", message: "Oportunidad publicada." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error al publicar." });
    }
  };

  const logout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Admin Dashboard</p>
            <h1 className="text-xl font-semibold">Revisión y Publicación</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adminId && loadPending(adminId)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50"
            >
              <RefreshCcw className="h-4 w-4" /> Refrescar
            </button>
            <Link to="/" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50">Inicio</Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="inline-flex items-center gap-2 text-sm text-indigo-300"><ShieldCheck className="h-4 w-4" /> Control de curación técnica y publicación.</p>
        </div>

        {status.message ? (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}>
            {status.message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-300">Cargando pendientes...</div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-300">No hay oportunidades pendientes.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((opportunity) => (
              <article key={opportunity.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">{opportunity.title}</h2>
                <p className="mt-2 text-sm text-zinc-300">{opportunity.description}</p>

                <div className="mt-4 space-y-2">
                  <label className="text-xs uppercase tracking-wider text-zinc-400">URL del curso</label>
                  <input
                    value={courseDraft[opportunity.id] ?? ""}
                    onChange={(event) => setCourseDraft((prev) => ({ ...prev, [opportunity.id]: event.target.value }))}
                    placeholder="https://curso.com/modulo"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => saveCourse(opportunity.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-indigo-400/60"
                  >
                    <BookCheck className="h-4 w-4" /> Guardar curso
                  </button>
                  <button
                    onClick={() => publish(opportunity.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Publicar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
