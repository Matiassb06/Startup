import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  Send,
  ShieldAlert,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
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

/* ───── Loading Skeleton ───── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-200/70" />
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("opportunities");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const session = getSession();
    if (!session?.access_token || session.user?.role !== "student") {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const [profileData, oppsData, appsData] = await Promise.all([
          api.get("/student/profile"),
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

  const completeCourse = async (opp) => {
    try {
      await api.post("/student/complete-course", { course_id: opp.course_id });
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

  const navItems = [
    { key: "opportunities", label: "Vacantes", icon: BriefcaseBusiness, count: opportunities.length },
    { key: "applications", label: "Mis Postulaciones", icon: FileText, count: applications.length },
    { key: "profile", label: "Mi Perfil", icon: User, count: null },
  ];

  return (
    <DashboardLayout
      title="Panel del Estudiante"
      navSection="Mi cuenta"
      userName={displayName}
      userRole="student"
      roleColor="indigo"
      navItems={navItems}
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
          {/* ══════════ TAB: Opportunities ══════════ */}
          {activeTab === "opportunities" && (
            <motion.div key="opportunities" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Vacantes disponibles</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Completa los cursos para desbloquear postulaciones.
                </p>
              </div>

              {opportunities.length === 0 ? (
                <motion.div
                  {...fadeUp}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                    <BriefcaseBusiness className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No hay vacantes disponibles por el momento.</p>
                </motion.div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="initial"
                  animate="animate"
                  className="grid gap-5 lg:grid-cols-2"
                >
                  {opportunities.map((opp) => {
                    const canApply = Boolean(opp.can_apply);
                    const progress = Number(opp.progress_percent ?? 0);
                    return (
                      <motion.article
                        key={opp.id}
                        variants={fadeUp}
                        className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-indigo-700">
                              {opp.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-gray-500">{opp.company_name}</p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                              opp.already_applied
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : canApply
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
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

                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                          {opp.description}
                        </p>
                        {opp.requirements && (
                          <p className="mt-2 text-xs text-gray-400">Requisitos: {opp.requirements}</p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-5">
                          <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                            <span>Progreso del curso</span>
                            <span className="font-medium tabular-nums">{progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                              className={`h-full rounded-full ${
                                progress === 100
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                  : "bg-gradient-to-r from-indigo-600 to-indigo-500"
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
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Ver material del curso
                          </a>
                        )}

                        {/* Actions */}
                        <div className="mt-5 flex flex-wrap gap-2">
                          {!opp.course_completed && opp.course_id && (
                            <button
                              onClick={() => completeCourse(opp)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                            >
                              <BookOpen className="h-4 w-4" /> Completar curso
                            </button>
                          )}
                          {!opp.already_applied && (
                            <button
                              disabled={!canApply}
                              onClick={() => applyToOpportunity(opp.id)}
                              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                                canApply
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                                  : "cursor-not-allowed bg-gray-100 text-gray-400"
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

          {/* ══════════ TAB: Applications ══════════ */}
          {activeTab === "applications" && (
            <motion.div key="applications" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Mis Postulaciones</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Historial de tus postulaciones enviadas.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                    <FileText className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Aún no has postulado a ninguna oportunidad.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80">
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Oportunidad
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Empresa
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Estado
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {applications.map((app, idx) => (
                          <tr
                            key={app.application_id}
                            className={`transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                          >
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {app.opportunity_title}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{app.company_name}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Postulado
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {app.applied_at
                                ? new Date(app.applied_at).toLocaleDateString("es-PE")
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="divide-y divide-gray-100 sm:hidden">
                    {applications.map((app) => (
                      <div key={app.application_id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{app.opportunity_title}</p>
                            <p className="mt-0.5 text-sm text-gray-500">{app.company_name}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Postulado
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          {app.applied_at
                            ? new Date(app.applied_at).toLocaleDateString("es-PE")
                            : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Profile ══════════ */}
          {activeTab === "profile" && profile && (
            <motion.div key="profile" {...tabContent} className="mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Profile header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-8">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold text-white ring-2 ring-white/30">
                      {displayName
                        .split(" ")
                        .filter(Boolean)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                      <p className="mt-0.5 text-sm text-indigo-100">{profile.email}</p>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="p-8">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Vacantes disponibles", value: opportunities.length, color: "text-gray-900" },
                      { label: "Postulaciones", value: applications.length, color: "text-emerald-600" },
                      {
                        label: "Cursos completados",
                        value: opportunities.filter((o) => o.course_completed).length,
                        color: "text-indigo-600",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center"
                      >
                        <p className={`text-3xl font-bold tabular-nums ${s.color}`}>
                          <AnimatedNumber value={s.value} />
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Profile data */}
                  {profile.profile_data && Object.keys(profile.profile_data).length > 0 && (
                    <div className="mt-8">
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">Datos de perfil</h3>
                      <div className="overflow-hidden rounded-lg border border-gray-100">
                        {Object.entries(profile.profile_data).map(([key, value], idx) => (
                          <div
                            key={key}
                            className={`flex justify-between px-4 py-3 text-sm ${
                              idx % 2 === 1 ? "bg-gray-50" : "bg-white"
                            }`}
                          >
                            <span className="capitalize text-gray-500">{key.replace(/_/g, " ")}</span>
                            <span className="font-medium text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
}
