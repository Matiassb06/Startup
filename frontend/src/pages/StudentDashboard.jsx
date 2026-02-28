import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, BriefcaseBusiness, CheckCircle2, Clock3, ExternalLink,
  FileText, LogOut, Send, ShieldAlert, Sparkles, User,
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
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer-skeleton h-12 flex-1" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shimmer-skeleton h-64" />
        ))}
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 tech-grid-bg" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      {/* ─── Decorative Orbs ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/[0.07] blur-[120px] animate-float" />
        <div className="absolute -right-40 top-2/3 h-[400px] w-[400px] rounded-full bg-violet-500/[0.05] blur-[100px] animate-float-delayed" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-indigo-400/70">
              <Sparkles className="h-3 w-3" /> Student Dashboard
            </p>
            <h1 className="mt-0.5 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold text-transparent">
              {displayName}
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
              className="rounded-xl border border-zinc-700/60 px-4 py-2 text-sm font-medium transition-all hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
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
        <div className="glow-line h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Status Toast ─── */}
        <AnimatePresence>
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="mb-6"
            >
              <div
                className={`rounded-xl border px-4 py-3 text-sm backdrop-blur-xl ${
                  status.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                }`}
              >
                {status.message}
                <button
                  onClick={() => setStatus({ type: "", message: "" })}
                  className="ml-3 text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                >
                  cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Tab Navigation ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mb-8 flex gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-1.5 backdrop-blur-xl"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="student-tab"
                  className="absolute inset-0 rounded-xl border border-indigo-500/20 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span
                className={`relative z-10 inline-flex items-center gap-2 transition-colors duration-200 ${
                  activeTab === tab.key ? "text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== null && (
                  <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[11px] tabular-nums">{tab.count}</span>
                )}
              </span>
            </button>
          ))}
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {/* ── TAB: Opportunities ── */}
            {activeTab === "opportunities" && (
              <motion.div key="opportunities" {...tabContent}>
                {opportunities.length === 0 ? (
                  <motion.div
                    {...fadeUp}
                    className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-16 text-center backdrop-blur-xl"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                      <BriefcaseBusiness className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500">No hay vacantes disponibles por el momento.</p>
                  </motion.div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 lg:grid-cols-2">
                    {opportunities.map((opp) => {
                      const canApply = Boolean(opp.can_apply);
                      const progress = Number(opp.progress_percent ?? 0);
                      return (
                        <motion.article
                          key={opp.id}
                          variants={fadeUp}
                          className="card-glow group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                        >
                          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent transition-all duration-500 group-hover:via-indigo-500/40" />

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h2 className="text-lg font-semibold text-white transition-colors group-hover:text-indigo-50">
                                {opp.title}
                              </h2>
                              <p className="mt-1 text-sm text-zinc-400">{opp.company_name}</p>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${
                                opp.already_applied
                                  ? "border border-blue-400/30 bg-blue-500/10 text-blue-300"
                                  : canApply
                                    ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 badge-glow"
                                    : "border border-amber-400/30 bg-amber-500/10 text-amber-300"
                              }`}
                            >
                              {opp.already_applied ? (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Postulado</>
                              ) : canApply ? (
                                <><CheckCircle2 className="h-3.5 w-3.5" /> Desbloqueado</>
                              ) : (
                                <><ShieldAlert className="h-3.5 w-3.5" /> Bloqueado</>
                              )}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300/80">{opp.description}</p>
                          {opp.requirements && (
                            <p className="mt-2 text-xs text-zinc-500">Requisitos: {opp.requirements}</p>
                          )}

                          {/* Progress bar */}
                          <div className="mt-5">
                            <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
                              <span>Progreso del curso</span>
                              <span className="tabular-nums">{progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                                className={`h-full rounded-full ${
                                  progress === 100
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                    : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                                }`}
                              />
                            </div>
                          </div>

                          {/* Course link */}
                          {opp.course_content_url && (
                            <a
                              href={opp.course_content_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400/80 transition-colors hover:text-indigo-300"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Ver material del curso
                            </a>
                          )}

                          {/* Actions */}
                          <div className="mt-5 flex flex-wrap gap-2">
                            {!opp.course_completed && opp.course_id && (
                              <button
                                onClick={() => completeCourse(opp)}
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-2.5 text-xs font-semibold text-zinc-100 transition-all hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                              >
                                <BookOpen className="h-4 w-4" /> Completar curso
                              </button>
                            )}
                            {!opp.already_applied && (
                              <button
                                disabled={!canApply}
                                onClick={() => applyToOpportunity(opp.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                                  canApply
                                    ? "bg-indigo-500 text-white hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                                    : "cursor-not-allowed bg-zinc-800/60 text-zinc-600"
                                }`}
                              >
                                <Send className="h-3.5 w-3.5" /> Postular
                              </button>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── TAB: Applications ── */}
            {activeTab === "applications" && (
              <motion.div key="applications" {...tabContent}>
                {applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-16 text-center backdrop-blur-xl">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                      <FileText className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500">Aún no has postulado a ninguna oportunidad.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                    {applications.map((app) => (
                      <motion.article
                        key={app.application_id}
                        variants={fadeUp}
                        className="card-glow group flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-xl"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{app.opportunity_title}</h3>
                          <p className="mt-1 text-sm text-zinc-400">{app.company_name}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Postulado
                          </span>
                          <p className="mt-1.5 flex items-center justify-end gap-1 text-xs text-zinc-500">
                            <Clock3 className="h-3 w-3" />
                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString("es-PE") : "—"}
                          </p>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── TAB: Profile ── */}
            {activeTab === "profile" && profile && (
              <motion.div key="profile" {...tabContent} className="mx-auto max-w-xl">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 backdrop-blur-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-2 ring-indigo-500/20 ring-offset-2 ring-offset-zinc-950">
                      <User className="h-10 w-10 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                      <p className="mt-0.5 text-sm text-zinc-400">{profile.email}</p>
                      <span className="mt-2 inline-block rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300">
                        Estudiante
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Vacantes disponibles", value: opportunities.length, color: "text-white" },
                      { label: "Postulaciones", value: applications.length, color: "text-emerald-400" },
                      {
                        label: "Cursos completados",
                        value: opportunities.filter((o) => o.course_completed).length,
                        color: "text-indigo-400",
                      },
                    ].map((s) => (
                      <div key={s.label} className="card-glow rounded-xl border border-zinc-700/40 bg-zinc-800/30 p-4 text-center">
                        <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
                          <AnimatedNumber value={s.value} />
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-8 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-300">Datos de perfil</h3>
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
