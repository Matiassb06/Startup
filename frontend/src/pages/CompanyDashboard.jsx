import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  LayoutDashboard,
  Loader2,
  PlusCircle,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../lib/api";
import { clearSession, getSession } from "../lib/session";
import SettingsPanel from "../components/SettingsPanel";

/* ───── Animation Variants ───── */
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const tabContent = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ───── Animated Number ───── */
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === "number" ? value : parseInt(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return display;
}

/* ───── Loading Skeleton ───── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      ))}
    </div>
  );
}

/* ───── "Coming Soon" Placeholder ───── */
function ComingSoon({ icon: Icon, title, description }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
        <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-zinc-500">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        Próximamente
      </span>
    </motion.div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [form, setForm] = useState({ title: "", description: "", requirements: "" });
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  /* ── AI Scoring state ── */
  const [scoringId, setScoringId] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [scoreModal, setScoreModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setStatus({ type: "", message: "" });
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
    const session = getSession();
    if (!session?.access_token || session?.role !== "company") {
      navigate("/login");
      return;
    }
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

  /* ── AI Scoring ── */
  const scoreApplicant = async (applicationId) => {
    setScoringId(applicationId);
    setScoreResult(null);
    try {
      const result = await api.post(
        `/company/opportunities/${selectedOpp.id}/applicants/${applicationId}/score`
      );
      setScoreResult(result);
      setScoreModal(true);
    } catch (error) {
      const msg = error?.data?.detail || error?.message || "Error al evaluar con IA.";
      setStatus({ type: "error", message: String(msg) });
    } finally {
      setScoringId(null);
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const companyName = profile?.profile_data?.company_name || profile?.email || "Empresa";

  const statusColors = {
    pending_review: "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    published: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    closed: "border-zinc-200 dark:border-zinc-500/30 bg-gray-100 dark:bg-zinc-500/10 text-gray-500 dark:text-zinc-400",
    draft: "border-zinc-200 dark:border-zinc-600/30 bg-gray-100 dark:bg-zinc-600/10 text-gray-500 dark:text-zinc-500",
  };

  const statusLabels = {
    pending_review: "En revisión",
    published: "Publicada",
    closed: "Cerrada",
    draft: "Borrador",
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "opportunities") setSelectedOpp(null);
  };

  /* ═══ UPPER NAV: Main tools ═══ */
  const navItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, count: null },
    { key: "opportunities", label: "Gestión de Oportunidades", icon: BriefcaseBusiness, count: opportunities.length },
    { key: "talents", label: "Base de Talentos", icon: Users, count: null },
  ];

  /* ═══ LOWER NAV: Preferences ═══ */
  const bottomNavItems = [
    { key: "company-profile", label: "Perfil de la Empresa", icon: Building2, count: null },
    { key: "settings", label: "Ajustes", icon: Settings, count: null },
  ];

  return (
    <DashboardLayout
      title="Panel de Empresa"
      navSection="Gestión"
      userName={companyName}
      userRole="company"
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={logout}
      statusToast={status}
      onDismissStatus={() => setStatus({ type: "", message: "" })}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {/* ══════════ TAB: Overview ══════════ */}
          {activeTab === "overview" && (
            <motion.div key="overview" {...tabContent} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Overview</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Estadísticas y métricas de tu empresa.</p>
              </div>

              {/* Stats Cards */}
              {stats && (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total oportunidades", value: stats.total_opportunities, icon: BriefcaseBusiness, color: "text-gray-900 dark:text-zinc-100" },
                    { label: "Publicadas", value: stats.published, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "En revisión", value: stats.pending_review, icon: Clock3, color: "text-amber-600 dark:text-amber-400" },
                    { label: "Total postulantes", value: stats.total_applicants, icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
                  ].map((stat) => (
                    <motion.div key={stat.label} variants={fadeUp} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                            <AnimatedNumber value={stat.value} />
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{stat.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Recent opportunities */}
              {opportunities.length > 0 && (
                <motion.div {...fadeUp} className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                  <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-zinc-300">Oportunidades recientes</h3>
                  <div className="space-y-3">
                    {opportunities.slice(0, 3).map((opp) => (
                      <div key={opp.id} className="flex items-center justify-between rounded-lg bg-white dark:bg-white/[0.02] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{opp.title}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">ID #{opp.id}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[opp.status] || statusColors.draft}`}>
                          {statusLabels[opp.status] || opp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  {opportunities.length > 3 && (
                    <button
                      onClick={() => handleTabChange("opportunities")}
                      className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Ver todas las oportunidades →
                    </button>
                  )}
                </motion.div>
              )}

              {/* Quick create */}
              <motion.div {...fadeUp}>
                <button
                  onClick={() => handleTabChange("opportunities")}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4" /> Crear nueva oportunidad
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════ TAB: Gestión de Oportunidades + Create ══════════ */}
          {activeTab === "opportunities" && !selectedOpp && (
            <motion.div key="opportunities" {...tabContent} className="space-y-8">
              {/* Create form */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Crear nueva oportunidad</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Será revisada por el equipo admin antes de publicarse.</p>

                <form className="mt-6 space-y-5" onSubmit={createOpportunity}>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Título</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Desarrollador Frontend Junior"
                      className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                      required
                      minLength={4}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe la posición, responsabilidades y lo que ofreces..."
                      className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                      rows={5}
                      required
                      minLength={10}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Requisitos <span className="text-gray-400 dark:text-zinc-600">(opcional)</span>
                    </label>
                    <input
                      value={form.requirements}
                      onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                      placeholder="Ej: React, TypeScript, 1 año de experiencia"
                      className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]">
                    <PlusCircle className="h-4 w-4" /> Crear oportunidad
                  </button>
                </form>
              </div>

              {/* Opportunity list */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">Mis Oportunidades</h2>
                {opportunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                      <BriefcaseBusiness className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">No tienes oportunidades creadas aún.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 md:grid-cols-2">
                    {opportunities.map((opp) => (
                      <motion.article key={opp.id} variants={fadeUp} className="group overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/20 hover:bg-gray-100 dark:hover:bg-white/[0.04]">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{opp.title}</h3>
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[opp.status] || statusColors.draft}`}>
                            {statusLabels[opp.status] || opp.status}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{opp.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs text-gray-400 dark:text-zinc-600">ID #{opp.id}</p>
                          {opp.status === "published" && (
                            <button
                              onClick={() => viewApplicants(opp)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-gray-200 dark:hover:bg-white/[0.06]"
                            >
                              <Users className="h-3.5 w-3.5" /> Ver postulantes
                            </button>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════ Applicants Detail View ══════════ */}
          {activeTab === "opportunities" && selectedOpp && (
            <motion.div key="applicants" {...tabContent}>
              <button
                onClick={() => setSelectedOpp(null)}
                className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-500 transition-colors hover:text-gray-900 dark:hover:text-zinc-200"
              >
                <ChevronLeft className="h-4 w-4" /> Volver a oportunidades
              </button>

              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Postulantes: {selectedOpp.title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                  {applicants.length} postulante{applicants.length !== 1 ? "s" : ""}
                </p>

                {loadingApplicants ? (
                  <div className="mt-6 flex flex-col items-center text-gray-500 dark:text-zinc-500">
                    <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 dark:border-zinc-700 border-t-emerald-500" />
                    Cargando postulantes...
                  </div>
                ) : applicants.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-500">Aún no hay postulantes para esta oportunidad.</p>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.06]">
                    {/* Desktop table */}
                    <div className="hidden sm:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Postulante</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Curso</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Fecha</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">IA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                          {applicants.map((a) => (
                            <tr key={a.application_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                              <td className="px-5 py-4">
                                <p className="font-medium text-gray-800 dark:text-zinc-200">{a.email}</p>
                                {a.profile_data?.first_name && (
                                  <p className="text-xs text-gray-500 dark:text-zinc-500">
                                    {a.profile_data.first_name} {a.profile_data.last_name || ""}
                                  </p>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                {a.course_completed ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-zinc-600">Sin curso</span>
                                )}
                                {a.course_score !== null && a.course_score !== undefined && (
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">Score: {a.course_score}/100</p>
                                )}
                              </td>
                              <td className="px-5 py-4 text-gray-500 dark:text-zinc-500">
                                {a.applied_at ? new Date(a.applied_at).toLocaleDateString("es-PE") : "—"}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => scoreApplicant(a.application_id)}
                                  disabled={scoringId === a.application_id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20 disabled:opacity-50"
                                >
                                  {scoringId === a.application_id ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluando…</>
                                  ) : (
                                    <><Sparkles className="h-3.5 w-3.5" /> Evaluar</>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile list */}
                    <div className="divide-y divide-gray-100 dark:divide-white/[0.04] sm:hidden">
                      {applicants.map((a) => (
                        <div key={a.application_id} className="px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-800 dark:text-zinc-200">{a.email}</p>
                              {a.profile_data?.first_name && (
                                <p className="text-xs text-gray-500 dark:text-zinc-500">
                                  {a.profile_data.first_name} {a.profile_data.last_name || ""}
                                </p>
                              )}
                            </div>
                            {a.course_completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-zinc-600">Sin curso</span>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-600">
                            {a.applied_at ? new Date(a.applied_at).toLocaleDateString("es-PE") : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════ TAB: Base de Talentos ══════════ */}
          {activeTab === "talents" && (
            <motion.div key="talents" {...tabContent}>
              <ComingSoon
                icon={Users}
                title="Base de Talentos"
                description="Aquí podrás explorar perfiles de candidatos, filtrar por habilidades y gestionar tu pipeline de talento. Esta funcionalidad estará disponible próximamente."
              />
            </motion.div>
          )}

          {/* ══════════ TAB: Perfil de la Empresa ══════════ */}
          {activeTab === "company-profile" && profile && (
            <motion.div key="company-profile" {...tabContent} className="mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                {/* Profile header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/20 text-xl font-bold text-white ring-2 ring-gray-200 dark:ring-white/30">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{companyName}</h2>
                      <p className="mt-0.5 text-sm text-emerald-100">{profile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Profile data */}
                <div className="p-8">
                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">Datos corporativos</h3>
                      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.06]">
                        {Object.entries(profile.profile_data).map(([key, value], idx) => (
                          <div
                            key={key}
                            className={`flex justify-between px-4 py-3 text-sm ${idx % 2 === 1 ? "bg-white dark:bg-white/[0.02]" : ""}`}
                          >
                            <span className="capitalize text-gray-500 dark:text-zinc-500">{key.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-800 dark:text-zinc-200">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-zinc-500">No hay datos corporativos registrados.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ TAB: Ajustes ══════════ */}
          {activeTab === "settings" && (
            <motion.div key="settings" {...tabContent}>
              <SettingsPanel role="company" profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {/* ═══════ Modal: Resultado de Scoring IA ═══════ */}
      <AnimatePresence>
        {scoreModal && scoreResult && (
          <motion.div
            key="score-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setScoreModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-white dark:bg-zinc-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Evaluación IA</h3>
                </div>
                <button onClick={() => setScoreModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Score */}
              <div className="px-6 py-6 space-y-4">
                {/* Score circle */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                    scoreResult.score >= 70
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : scoreResult.score >= 40
                        ? "border-amber-500 text-amber-600 dark:text-amber-400"
                        : "border-rose-500 text-rose-600 dark:text-rose-400"
                  }`}>
                    <span className="text-2xl font-bold">{scoreResult.score}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Compatibilidad</p>
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3">
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{scoreResult.summary}</p>
                </div>

                {/* Strengths */}
                {scoreResult.strengths?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Fortalezas</p>
                    <ul className="space-y-1">
                      {scoreResult.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas to improve */}
                {scoreResult.areas_to_improve?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Áreas de mejora</p>
                    <ul className="space-y-1">
                      {scoreResult.areas_to_improve.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400">
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-center text-amber-500">•</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div className="rounded-lg border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-3">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1">Recomendación IA</p>
                  <p className="text-sm text-violet-600 dark:text-violet-400">{scoreResult.recommendation}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end border-t border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <button
                  onClick={() => setScoreModal(false)}
                  className="rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98]"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
