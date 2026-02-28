import { BookOpen, BriefcaseBusiness, CheckCircle2, Clock3, ExternalLink, FileText, LogOut, Send, ShieldAlert, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { clearSession, getSession } from "../lib/session";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("opportunities");
  const [status, setStatus] = useState({ type: "", message: "" });

  const session = getSession();

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const [profileData, oppsData, appsData] = await Promise.all([
          api.get("/auth/me"),
          api.get("/student/opportunities"),
          api.get("/student/applications"),
        ]);
        setProfile(profileData);
        setOpportunities(Array.isArray(oppsData) ? oppsData : []);
        setApplications(Array.isArray(appsData) ? appsData : []);
      } catch (error) {
        setStatus({ type: "error", message: error.message || "Error al cargar datos." });
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const completeCourse = async (opportunity) => {
    if (!opportunity.course_id) {
      setStatus({ type: "error", message: "Esta vacante aún no tiene curso asociado." });
      return;
    }
    try {
      await api.post(`/student/courses/${opportunity.course_id}/complete`, { score: 100 });
      const oppsData = await api.get("/student/opportunities");
      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      setStatus({ type: "success", message: "Curso completado. Postulación desbloqueada." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error al completar curso." });
    }
  };

  const applyToOpportunity = async (opportunityId) => {
    try {
      const result = await api.post("/student/apply", { opportunity_id: opportunityId });
      setStatus({ type: "success", message: result.message || "Postulación enviada." });
      const [oppsData, appsData] = await Promise.all([
        api.get("/student/opportunities"),
        api.get("/student/applications"),
      ]);
      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "No se pudo postular." });
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const displayName =
    profile?.profile_data?.first_name
      ? `${profile.profile_data.first_name} ${profile.profile_data.last_name || ""}`
      : profile?.email || "Estudiante";

  const tabs = [
    { key: "opportunities", label: "Vacantes", icon: BriefcaseBusiness, count: opportunities.length },
    { key: "applications", label: "Mis Postulaciones", icon: FileText, count: applications.length },
    { key: "profile", label: "Mi Perfil", icon: User, count: null },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Student Dashboard</p>
            <h1 className="text-xl font-semibold">{displayName}</h1>
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status message */}
        {status.message ? (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
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

        {/* Tab navigation */}
        <div className="mb-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-indigo-500/20 text-indigo-300 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== null ? (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">{tab.count}</span>
              ) : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-400" />
            Cargando datos...
          </div>
        ) : (
          <>
            {/* ── TAB: Opportunities ── */}
            {activeTab === "opportunities" && (
              <div className="grid gap-4 lg:grid-cols-2">
                {opportunities.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
                    No hay vacantes disponibles por el momento.
                  </div>
                ) : null}
                {opportunities.map((opp) => {
                  const canApply = Boolean(opp.can_apply);
                  const progress = Number(opp.progress_percent ?? 0);
                  return (
                    <article key={opp.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-white">{opp.title}</h2>
                          <p className="mt-1 text-sm text-zinc-400">{opp.company_name}</p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            opp.already_applied
                              ? "border border-blue-400/40 bg-blue-500/10 text-blue-300"
                              : canApply
                                ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                                : "border border-amber-400/40 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {opp.already_applied ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Postulado
                            </>
                          ) : canApply ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Desbloqueado
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-3.5 w-3.5" /> Bloqueado
                            </>
                          )}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm text-zinc-300">{opp.description}</p>
                      {opp.requirements && (
                        <p className="mt-2 text-xs text-zinc-500">Requisitos: {opp.requirements}</p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="mb-1 flex justify-between text-xs text-zinc-400">
                          <span>Progreso del curso</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Course link */}
                      {opp.course_content_url && (
                        <a
                          href={opp.course_content_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-300 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Ver material del curso
                        </a>
                      )}

                      {/* Actions */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {!opp.course_completed && opp.course_id && (
                          <button
                            onClick={() => completeCourse(opp)}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-indigo-400/50"
                          >
                            <BookOpen className="h-4 w-4" /> Completar curso
                          </button>
                        )}
                        {!opp.already_applied && (
                          <button
                            disabled={!canApply}
                            onClick={() => applyToOpportunity(opp.id)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                              canApply
                                ? "bg-indigo-500 text-white hover:bg-indigo-400"
                                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            <Send className="h-3.5 w-3.5" /> Postular
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ── TAB: Applications ── */}
            {activeTab === "applications" && (
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
                    Aún no has postulado a ninguna oportunidad.
                  </div>
                ) : null}
                {applications.map((app) => (
                  <article
                    key={app.application_id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <div>
                      <h3 className="font-semibold text-white">{app.opportunity_title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{app.company_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Postulado
                      </span>
                      <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                        <Clock3 className="h-3 w-3" />
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString("es-PE") : "—"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* ── TAB: Profile ── */}
            {activeTab === "profile" && profile && (
              <div className="mx-auto max-w-xl">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{displayName}</h2>
                      <p className="text-sm text-zinc-400">{profile.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                        Estudiante
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4 text-center">
                      <p className="text-2xl font-semibold text-white">{opportunities.length}</p>
                      <p className="text-xs text-zinc-400">Vacantes disponibles</p>
                    </div>
                    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4 text-center">
                      <p className="text-2xl font-semibold text-emerald-400">{applications.length}</p>
                      <p className="text-xs text-zinc-400">Postulaciones</p>
                    </div>
                    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-4 text-center">
                      <p className="text-2xl font-semibold text-indigo-400">
                        {opportunities.filter((o) => o.course_completed).length}
                      </p>
                      <p className="text-xs text-zinc-400">Cursos completados</p>
                    </div>
                  </div>

                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-300">Datos de perfil</h3>
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
