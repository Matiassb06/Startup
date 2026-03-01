import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
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
      {[1, 2, 3, 4].map((i) => (
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

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState({ type: "", message: "" });

  /* ── AI Tutor state ── */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatCourseId, setChatCourseId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.access_token || session?.role !== "student") {
      navigate("/login");
      return;
    }
    (async () => {
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
        setStatus({ type: "error", message: error.message || "Error cargando datos." });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

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

  /* ── AI Tutor functions ── */
  const openTutor = (courseId) => {
    setChatCourseId(courseId);
    setChatMessages([]);
    setChatOpen(true);
  };

  const sendTutorMessage = async () => {
    if (!chatInput.trim() || !chatCourseId || chatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatLoading(true);
    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const resp = await api.post(`/student/courses/${chatCourseId}/ask`, {
        question,
        conversation_history: history,
      });
      setChatMessages((prev) => [...prev, { role: "assistant", content: resp.answer }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "❌ Error: " + (error?.data?.detail || error?.message || "No se pudo contactar al tutor.") }]);
    } finally {
      setChatLoading(false);
    }
  };

  const displayName =
    profile?.profile_data?.first_name
      ? `${profile.profile_data.first_name} ${profile.profile_data.last_name || ""}`
      : profile?.email || "Estudiante";

  const coursesCompleted = opportunities.filter((o) => o.course_completed).length;

  /* ═══ UPPER NAV: Main tools ═══ */
  const navItems = [
    { key: "overview", label: "Panel General", icon: LayoutDashboard, count: null },
    { key: "courses", label: "Ruta de Aprendizaje", icon: GraduationCap, count: null },
    { key: "opportunities", label: "Bolsa de Oportunidades", icon: BriefcaseBusiness, count: opportunities.length },
    { key: "applications", label: "Mis Postulaciones", icon: FileText, count: applications.length },
  ];

  /* ═══ LOWER NAV: Preferences ═══ */
  const bottomNavItems = [
    { key: "resume", label: "Mi Currículum", icon: User, count: null },
    { key: "settings", label: "Ajustes", icon: Settings, count: null },
  ];

  return (
    <>
    <DashboardLayout
      title="Panel del Estudiante"
      navSection="Principal"
      userName={displayName}
      userRole="student"
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={logout}
      statusToast={status}
      onDismissStatus={() => setStatus({ type: "", message: "" })}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {/* ══════════ TAB: Panel General (Overview) ══════════ */}
          {activeTab === "overview" && (
            <motion.div key="overview" {...tabContent} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Bienvenido, {displayName.split(" ")[0]}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Resumen de tu actividad en la plataforma.</p>
              </div>

              {/* Stats cards */}
              <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Vacantes disponibles", value: opportunities.length, color: "text-gray-900 dark:text-zinc-100" },
                  { label: "Postulaciones enviadas", value: applications.length, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Cursos completados", value: coursesCompleted, color: "text-emerald-600 dark:text-emerald-400" },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    variants={fadeUp}
                    className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5"
                  >
                    <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
                      <AnimatedNumber value={s.value} />
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Recent applications */}
              {applications.length > 0 && (
                <motion.div {...fadeUp} className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                  <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-zinc-300">Postulaciones recientes</h3>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.application_id} className="flex items-center justify-between rounded-lg bg-white dark:bg-white/[0.02] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{app.opportunity_title}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{app.company_name}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Postulado
                        </span>
                      </div>
                    ))}
                  </div>
                  {applications.length > 3 && (
                    <button
                      onClick={() => setActiveTab("applications")}
                      className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      Ver todas las postulaciones →
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Ruta de Aprendizaje (Courses) ══════════ */}
          {activeTab === "courses" && (
            <motion.div key="courses" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Ruta de Aprendizaje</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                  Completa los cursos asociados a cada vacante para desbloquear tu postulación.
                </p>
              </div>

              {opportunities.length === 0 ? (
                <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                    <GraduationCap className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No hay cursos disponibles por el momento.</p>
                </motion.div>
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
                  {opportunities.map((opp) => {
                    const progress = Number(opp.progress_percent ?? 0);
                    return (
                      <motion.div
                        key={opp.id}
                        variants={fadeUp}
                        className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{opp.title}</h3>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-500">{opp.company_name}</p>
                            {opp.course_name && (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                <GraduationCap className="h-3.5 w-3.5" /> Curso: {opp.course_name}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            opp.course_completed
                              ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                            {opp.course_completed ? (
                              <><CheckCircle2 className="h-3.5 w-3.5" /> Completado</>
                            ) : (
                              <><BookOpen className="h-3.5 w-3.5" /> En progreso</>
                            )}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-5">
                          <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-zinc-500">
                            <span>Progreso del curso</span>
                            <span className="font-medium tabular-nums">{progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                              className={`h-full rounded-full ${
                                progress === 100
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                  : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Course modules & topics */}
                        {opp.course_modules && opp.course_modules.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {opp.course_modules.map((mod) => (
                              <div key={mod.id} className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] p-2">
                                <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">{mod.title}</p>
                                {mod.topics && mod.topics.length > 0 && (
                                  <ul className="mt-1 space-y-0.5 pl-3">
                                    {mod.topics.map((topic) => (
                                      <li key={topic.id} className="text-xs text-gray-500 dark:text-zinc-400">
                                        <a
                                          href={topic.content_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                                        >
                                          <ExternalLink className="h-3 w-3 shrink-0" /> {topic.title}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Course action buttons */}
                        {!opp.course_completed && opp.course_id && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate(`/student/course/${opp.course_id}`)}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
                            >
                              <BookOpen className="h-4 w-4" /> {progress > 0 ? "Continuar curso" : "Comenzar curso"}
                            </button>
                            <button
                              onClick={() => openTutor(opp.course_id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20 active:scale-[0.98]"
                            >
                              <Sparkles className="h-4 w-4" /> Pregunta al Tutor IA
                            </button>
                          </div>
                        )}
                        {opp.course_completed && opp.course_id && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate(`/student/course/${opp.course_id}`)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-all hover:bg-gray-200 dark:hover:bg-white/[0.06] active:scale-[0.98]"
                            >
                              <BookOpen className="h-4 w-4" /> Revisar curso
                            </button>
                            <button
                              onClick={() => openTutor(opp.course_id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20 active:scale-[0.98]"
                            >
                              <Sparkles className="h-4 w-4" /> Pregunta al Tutor IA
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Bolsa de Oportunidades ══════════ */}
          {activeTab === "opportunities" && (
            <motion.div key="opportunities" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Bolsa de Oportunidades</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                  Postula a las vacantes disponibles. Completa el curso para desbloquear la postulación.
                </p>
              </div>

              {opportunities.length === 0 ? (
                <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                    <BriefcaseBusiness className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No hay vacantes disponibles por el momento.</p>
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
                        className="group overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/20 hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {opp.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-500">{opp.company_name}</p>
                            {opp.course_name && (
                              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                <GraduationCap className="h-3.5 w-3.5" /> Curso: {opp.course_name}
                              </p>
                            )}
                          </div>
                          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            opp.already_applied
                              ? "border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : canApply
                                ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}>
                            {opp.already_applied ? (
                              <><CheckCircle2 className="h-3.5 w-3.5" /> Postulado</>
                            ) : canApply ? (
                              <><CheckCircle2 className="h-3.5 w-3.5" /> Desbloqueado</>
                            ) : (
                              <><ShieldAlert className="h-3.5 w-3.5" /> Bloqueado</>
                            )}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
                          {opp.description}
                        </p>
                        {opp.requirements && (
                          <p className="mt-2 text-xs text-gray-400 dark:text-zinc-600">Requisitos: {opp.requirements}</p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-5">
                          <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-zinc-500">
                            <span>Progreso del curso</span>
                            <span className="font-medium tabular-nums">{progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                              className={`h-full rounded-full ${
                                progress === 100
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                  : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {!opp.already_applied && (
                            <button
                              disabled={!canApply}
                              onClick={() => applyToOpportunity(opp.id)}
                              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                                canApply
                                  ? "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98]"
                                  : "cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-zinc-600"
                              }`}
                            >
                              <Send className="h-3.5 w-3.5" /> Postular
                            </button>
                          )}
                          {!canApply && !opp.already_applied && opp.course_id && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />
                              Completa el curso obligatorio para desbloquear tu postulación.
                            </p>
                          )}
                        </div>
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Mis Postulaciones ══════════ */}
          {activeTab === "applications" && (
            <motion.div key="applications" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Mis Postulaciones</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Historial de tus postulaciones enviadas.</p>
              </div>

              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                    <FileText className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Aún no has postulado a ninguna oportunidad.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Oportunidad</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Empresa</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Estado</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                        {applications.map((app, idx) => (
                          <tr key={app.application_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-zinc-200">{app.opportunity_title}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">{app.company_name}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Postulado
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-zinc-500">
                              {app.applied_at ? new Date(app.applied_at).toLocaleDateString("es-PE") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.04] sm:hidden">
                    {applications.map((app) => (
                      <div key={app.application_id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-zinc-200">{app.opportunity_title}</p>
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-500">{app.company_name}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Postulado
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400 dark:text-zinc-600">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString("es-PE") : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Mi Currículum ══════════ */}
          {activeTab === "resume" && profile && (
            <motion.div key="resume" {...tabContent} className="mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                {/* Profile header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/20 text-xl font-bold text-white ring-2 ring-gray-200 dark:ring-white/30">
                      {displayName.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                      <p className="mt-0.5 text-sm text-emerald-100">{profile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="p-8">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Vacantes disponibles", value: opportunities.length, color: "text-gray-900 dark:text-zinc-100" },
                      { label: "Postulaciones", value: applications.length, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Cursos completados", value: coursesCompleted, color: "text-emerald-600 dark:text-emerald-400" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 text-center">
                        <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
                          <AnimatedNumber value={s.value} />
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Profile data */}
                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-8">
                      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-zinc-300">Datos de perfil</h3>
                      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/[0.06]">
                        {Object.entries(profile.profile_data).map(([key, value], idx) => (
                          <div
                            key={key}
                            className={`flex justify-between px-4 py-3 text-sm ${
                              idx % 2 === 1 ? "bg-white dark:bg-white/[0.02]" : ""
                            }`}
                          >
                            <span className="capitalize text-gray-500 dark:text-zinc-500">{key.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-800 dark:text-zinc-200">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════ TAB: Ajustes ══════════ */}
          {activeTab === "settings" && (
            <motion.div key="settings" {...tabContent}>
              <SettingsPanel role="student" profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>

    {/* ═══════ Floating AI Tutor Chat ═══════ */}
    <AnimatePresence>
      {chatOpen && (
        <motion.div
          key="ai-tutor-chat"
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-white dark:bg-zinc-900 shadow-2xl"
        >
          {/* Chat header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-200 dark:border-white/[0.06] bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Tutor IA</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="rounded-lg p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "350px", minHeight: "200px" }}>
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Sparkles className="h-8 w-8 text-violet-400 mb-3" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">¡Hola! Soy tu tutor IA.</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Pregúntame cualquier duda sobre tu curso.</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-zinc-200 rounded-bl-sm"
                }`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pensando…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendTutorMessage()}
                placeholder="Escribe tu pregunta…"
                disabled={chatLoading}
                className="flex-1 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-violet-400 dark:focus:border-violet-500/50 disabled:opacity-50"
              />
              <button
                onClick={sendTutorMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="rounded-lg bg-violet-600 p-2 text-white transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ═══════ Floating Tutor button (when chat is closed) ═══════ */}
    {!chatOpen && chatCourseId && (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    )}
    </>
  );
}
