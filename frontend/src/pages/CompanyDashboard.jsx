import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  LogOut,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { clearSession, getSession } from "../lib/session";

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

/* ───── Shimmer Skeleton ───── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer-skeleton h-24" />)}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer-skeleton h-12 flex-1" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => <div key={i} className="shimmer-skeleton h-48" />)}
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 tech-grid-bg" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      {/* ─── Decorative Orbs ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/[0.06] blur-[120px] animate-float" />
        <div className="absolute -right-40 bottom-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px] animate-float-delayed" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-violet-400/70">
              <Sparkles className="h-3 w-3" /> Company Dashboard
            </p>
            <h1 className="mt-0.5 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold text-transparent">
              {companyName}
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex gap-2"
          >
            <Link
              to="/"
              className="rounded-xl border border-zinc-700/60 px-4 py-2 text-sm font-medium transition-all hover:border-violet-400/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            >
              Inicio
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-800/80 px-4 py-2 text-sm font-medium transition-all hover:bg-zinc-700/80"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </motion.div>
        </div>
        <div className="glow-line h-[1px] w-full bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </header>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Status Toast ─── */}
        <AnimatePresence>
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-xl ${
                  status.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                }`}
              >
                {status.message}
                <button onClick={() => setStatus({ type: "", message: "" })} className="ml-3 text-xs underline opacity-60 hover:opacity-100 transition-opacity">
                  cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Stats Cards ─── */}
        {stats && (
          <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total oportunidades", value: stats.total_opportunities, icon: BriefcaseBusiness, color: "text-white" },
              { label: "Publicadas", value: stats.published, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "En revisión", value: stats.pending_review, icon: Clock3, color: "text-amber-400" },
              { label: "Total postulantes", value: stats.total_applicants, icon: Users, color: "text-indigo-400" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="card-glow group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-xl"
              >
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/0 to-transparent transition-all duration-500 group-hover:via-zinc-600/50" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
                      <AnimatedNumber value={stat.value} />
                    </p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ─── Tab Navigation ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-1.5 backdrop-blur-xl"
        >
          {[
            { key: "opportunities", label: "Mis Oportunidades", icon: BriefcaseBusiness },
            { key: "create", label: "Crear nueva", icon: PlusCircle },
            { key: "profile", label: "Perfil empresa", icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedOpp(null); }}
              className="relative inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="company-tab"
                  className="absolute inset-0 rounded-xl border border-violet-500/20 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.08)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span
                className={`relative z-10 inline-flex items-center gap-2 transition-colors duration-200 ${
                  activeTab === tab.key ? "text-violet-300" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          ))}
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {/* ── TAB: Opportunities ── */}
            {activeTab === "opportunities" && !selectedOpp && (
              <motion.div key="opportunities" {...tabContent}>
                {opportunities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-16 text-center backdrop-blur-xl">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                      <BriefcaseBusiness className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500">No tienes oportunidades creadas aún.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 md:grid-cols-2">
                    {opportunities.map((opp) => (
                      <motion.article
                        key={opp.id}
                        variants={fadeUp}
                        className="card-glow group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/0 to-transparent transition-all duration-500 group-hover:via-violet-500/40" />
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-white">{opp.title}</h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              statusColors[opp.status] || statusColors.draft
                            }`}
                          >
                            {statusLabels[opp.status] || opp.status}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-300/80">{opp.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs text-zinc-600">ID #{opp.id}</p>
                          {opp.status === "published" && (
                            <button
                              onClick={() => viewApplicants(opp)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700/60 px-3 py-2 text-xs font-semibold text-violet-300 transition-all hover:border-violet-400/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                            >
                              <Users className="h-3.5 w-3.5" /> Ver postulantes
                            </button>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Applicants detail view ── */}
            {activeTab === "opportunities" && selectedOpp && (
              <motion.div key="applicants" {...tabContent}>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <ChevronLeft className="h-4 w-4" /> Volver a oportunidades
                </button>

                <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <h2 className="text-lg font-semibold text-white">Postulantes: {selectedOpp.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {applicants.length} postulante{applicants.length !== 1 ? "s" : ""}
                  </p>

                  {loadingApplicants ? (
                    <div className="mt-6 flex flex-col items-center text-zinc-400">
                      <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-violet-400" />
                      Cargando postulantes...
                    </div>
                  ) : applicants.length === 0 ? (
                    <p className="mt-6 text-center text-zinc-500">Aún no hay postulantes para esta oportunidad.</p>
                  ) : (
                    <motion.div variants={stagger} initial="initial" animate="animate" className="mt-4 space-y-3">
                      {applicants.map((a) => (
                        <motion.div
                          key={a.application_id}
                          variants={fadeUp}
                          className="card-glow flex items-center justify-between rounded-xl border border-zinc-700/40 bg-zinc-800/30 p-4 backdrop-blur-sm"
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
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── TAB: Create opportunity ── */}
            {activeTab === "create" && (
              <motion.div key="create" {...tabContent} className="mx-auto max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <h2 className="text-lg font-semibold text-white">Crear nueva oportunidad</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    La oportunidad será revisada por el equipo admin antes de publicarse.
                  </p>
                  <form className="mt-6 space-y-5" onSubmit={createOpportunity}>
                    <div>
                      <label className="mb-1.5 block text-xs uppercase tracking-wider text-zinc-500">Título</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Ej: Desarrollador Frontend Junior"
                        className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        required
                        minLength={4}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs uppercase tracking-wider text-zinc-500">Descripción</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe la posición, responsabilidades y lo que ofreces..."
                        className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                        rows={5}
                        required
                        minLength={10}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs uppercase tracking-wider text-zinc-500">
                        Requisitos (opcional)
                      </label>
                      <input
                        value={form.requirements}
                        onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                        placeholder="Ej: React, TypeScript, 1 año de experiencia"
                        className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400/50 focus:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                      />
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-400 hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98]">
                      <PlusCircle className="h-4 w-4" /> Crear oportunidad
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── TAB: Company profile ── */}
            {activeTab === "profile" && profile && (
              <motion.div key="profile" {...tabContent} className="mx-auto max-w-xl">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-zinc-950">
                      <Building2 className="h-10 w-10 text-violet-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{companyName}</h2>
                      <p className="mt-0.5 text-sm text-zinc-400">{profile.email}</p>
                      <span className="mt-2 inline-block rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
                        Empresa
                      </span>
                    </div>
                  </div>

                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-8 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-300">Datos corporativos</h3>
                      {Object.entries(profile.profile_data).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between rounded-xl bg-zinc-800/30 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-800/50"
                        >
                          <span className="text-zinc-500">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium text-zinc-200">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
