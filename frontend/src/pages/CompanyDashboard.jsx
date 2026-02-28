import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  LogOut,
  PlusCircle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { clearSession, getSession } from "../lib/session";

export function CompanyDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState({ title: "", description: "", requirements: "" });
  const [activeTab, setActiveTab] = useState("opportunities");

  // Applicants viewer
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, oppsData, statsData] = await Promise.all([
        api.get("/auth/me"),
        api.get("/company/opportunities"),
        api.get("/company/stats"),
      ]);
      setProfile(profileData);
      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      setStats(statsData);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error cargando datos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createOpportunity = async (event) => {
    event.preventDefault();
    try {
      await api.post("/company/opportunities", {
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
      });
      setForm({ title: "", description: "", requirements: "" });
      await loadData();
      setStatus({ type: "success", message: "Oportunidad creada correctamente. Pendiente de revisión." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error al crear oportunidad." });
    }
  };

  const viewApplicants = async (opp) => {
    setSelectedOpp(opp);
    setLoadingApplicants(true);
    try {
      const data = await api.get(`/company/opportunities/${opp.id}/applicants`);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error cargando postulantes." });
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const companyName = profile?.profile_data?.company_name || profile?.email || "Empresa";

  const statusColors = {
    pending_review: "border-amber-400/40 bg-amber-500/10 text-amber-300",
    published: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
    closed: "border-zinc-400/40 bg-zinc-500/10 text-zinc-300",
    draft: "border-zinc-400/40 bg-zinc-500/10 text-zinc-400",
  };

  const statusLabels = {
    pending_review: "En revisión",
    published: "Publicada",
    closed: "Cerrada",
    draft: "Borrador",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Company Dashboard</p>
            <h1 className="text-xl font-semibold">{companyName}</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50">
              Inicio
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Status message */}
        {status.message ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-400/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            {status.message}
            <button onClick={() => setStatus({ type: "", message: "" })} className="ml-3 text-xs underline opacity-70">
              cerrar
            </button>
          </div>
        ) : null}

        {/* Stats cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total oportunidades", value: stats.total_opportunities, icon: BriefcaseBusiness },
              { label: "Publicadas", value: stats.published, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "En revisión", value: stats.pending_review, icon: Clock3, color: "text-amber-400" },
              { label: "Total postulantes", value: stats.total_applicants, icon: Users, color: "text-indigo-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color || "text-zinc-400"}`} />
                  <div>
                    <p className={`text-2xl font-semibold ${stat.color || "text-white"}`}>{stat.value}</p>
                    <p className="text-xs text-zinc-400">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {[
            { key: "opportunities", label: "Mis Oportunidades", icon: BriefcaseBusiness },
            { key: "create", label: "Crear nueva", icon: PlusCircle },
            { key: "profile", label: "Perfil empresa", icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedOpp(null);
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-400" />
            Cargando...
          </div>
        ) : (
          <>
            {/* ── TAB: Opportunities ── */}
            {activeTab === "opportunities" && !selectedOpp && (
              <div className="grid gap-4 md:grid-cols-2">
                {opportunities.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
                    No tienes oportunidades creadas aún.
                  </div>
                ) : null}
                {opportunities.map((opp) => (
                  <article key={opp.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white">{opp.title}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          statusColors[opp.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[opp.status] || opp.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{opp.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-zinc-500">ID #{opp.id}</p>
                      {opp.status === "published" && (
                        <button
                          onClick={() => viewApplicants(opp)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:border-indigo-400/50"
                        >
                          <Users className="h-3.5 w-3.5" /> Ver postulantes
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* ── Applicants detail view ── */}
            {activeTab === "opportunities" && selectedOpp && (
              <div>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  <ChevronLeft className="h-4 w-4" /> Volver a oportunidades
                </button>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <h2 className="text-lg font-semibold text-white">Postulantes: {selectedOpp.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {applicants.length} postulante{applicants.length !== 1 ? "s" : ""}
                  </p>

                  {loadingApplicants ? (
                    <div className="mt-6 text-center text-zinc-400">
                      <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-400" />
                      Cargando postulantes...
                    </div>
                  ) : applicants.length === 0 ? (
                    <p className="mt-6 text-center text-zinc-500">Aún no hay postulantes para esta oportunidad.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {applicants.map((a) => (
                        <div
                          key={a.application_id}
                          className="flex items-center justify-between rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4"
                        >
                          <div>
                            <p className="font-medium text-white">{a.email}</p>
                            {a.profile_data?.first_name && (
                              <p className="text-sm text-zinc-400">
                                {a.profile_data.first_name} {a.profile_data.last_name || ""}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-zinc-500">
                              Postulado: {a.applied_at ? new Date(a.applied_at).toLocaleDateString("es-PE") : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            {a.course_completed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Curso completado
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-500">Sin curso</span>
                            )}
                            {a.course_score !== null && a.course_score !== undefined && (
                              <p className="mt-1 text-xs text-zinc-400">Score: {a.course_score}/100</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: Create opportunity ── */}
            {activeTab === "create" && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">Crear nueva oportunidad</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  La oportunidad será revisada por el equipo admin antes de publicarse.
                </p>
                <form className="mt-5 space-y-4" onSubmit={createOpportunity}>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Título</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Desarrollador Frontend Junior"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                      required
                      minLength={4}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe la posición, responsabilidades y lo que ofreces..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                      rows={5}
                      required
                      minLength={10}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">
                      Requisitos (opcional)
                    </label>
                    <input
                      value={form.requirements}
                      onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                      placeholder="Ej: React, TypeScript, 1 año de experiencia"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400">
                    <PlusCircle className="h-4 w-4" /> Crear oportunidad
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB: Company profile ── */}
            {activeTab === "profile" && profile && (
              <div className="mx-auto max-w-xl">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{companyName}</h2>
                      <p className="text-sm text-zinc-400">{profile.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                        Empresa
                      </span>
                    </div>
                  </div>

                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-300">Datos corporativos</h3>
                      {Object.entries(profile.profile_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-sm">
                          <span className="text-zinc-400">{key.replace(/_/g, " ")}</span>
                          <span className="text-zinc-100">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
