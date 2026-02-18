import { BriefcaseBusiness, Clock3, LogOut, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE } from "../lib/config";
import { clearSession, getSession, mergeSession } from "../lib/session";

export function CompanyDashboard() {
  const [companyId, setCompanyId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState({ title: "", description: "", requirements: "" });

  const loadCompanyOpportunities = async (id) => {
    const response = await fetch(`${API_BASE}/company/opportunities/?company_id=${id}`);
    if (!response.ok) throw new Error("No se pudieron cargar tus oportunidades.");
    const payload = await response.json();
    setOpportunities(Array.isArray(payload) ? payload : []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const current = getSession();
        const email = current?.email || `company.${Date.now()}@train.com`;
        const response = await fetch(`${API_BASE}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password_hash: "demo_company_profile",
            role: "company",
            profile_data: { source: "company_dashboard" },
          }),
        });

        if (!response.ok) throw new Error("No se pudo inicializar perfil de empresa.");
        const payload = await response.json();
        const resolvedId = payload.user_id ?? payload.id;
        mergeSession({ role: "company", userId: resolvedId, email });
        setCompanyId(resolvedId);
        await loadCompanyOpportunities(resolvedId);
      } catch (error) {
        setStatus({ type: "error", message: error instanceof Error ? error.message : "Error inesperado." });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const createOpportunity = async (event) => {
    event.preventDefault();
    if (!companyId) return;

    try {
      const response = await fetch(`${API_BASE}/company/opportunities/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_user_id: companyId,
          title: form.title,
          description: form.description,
          requirements: form.requirements || null,
        }),
      });
      if (!response.ok) throw new Error("No se pudo crear la oportunidad.");

      setForm({ title: "", description: "", requirements: "" });
      await loadCompanyOpportunities(companyId);
      setStatus({ type: "success", message: "Oportunidad creada en pending_review." });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error al crear oportunidad." });
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
            <p className="text-xs uppercase tracking-wider text-zinc-400">Company Dashboard</p>
            <h1 className="text-xl font-semibold">Gestión de Oportunidades</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50">Inicio</Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {status.message ? (
          <div className={`rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}>
            {status.message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Crear nueva oportunidad</h2>
          <form className="mt-4 space-y-3" onSubmit={createOpportunity}>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Título"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              required
              minLength={4}
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Descripción"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              rows={4}
              required
              minLength={10}
            />
            <input
              value={form.requirements}
              onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value }))}
              placeholder="Requisitos (opcional)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              <PlusCircle className="h-4 w-4" /> Crear oportunidad
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Mis oportunidades</h2>
          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-300">Cargando...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {opportunities.map((opportunity) => (
                <article key={opportunity.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-white">{opportunity.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                      <Clock3 className="h-3.5 w-3.5" /> {opportunity.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{opportunity.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-300"><BriefcaseBusiness className="h-3.5 w-3.5" /> ID #{opportunity.id}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
