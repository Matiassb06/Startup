import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../lib/api";
import { clearSession } from "../lib/session";
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
      <div className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeTab, setActiveTab] = useState("pending");
  const [userFilter, setUserFilter] = useState("");

  /* ── Modal de publicación (dropdown del catálogo) ── */
  const [publishModal, setPublishModal] = useState(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [publishing, setPublishing] = useState(false);

  /* ── Modal de crear/editar curso del catálogo ── */
  const [courseModal, setCourseModal] = useState(null); // null | { mode: "create" } | { mode: "edit", course: {...} }
  const [courseForm, setCourseForm] = useState({ name: "", description: "", content_url: "" });
  const [savingCourse, setSavingCourse] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, metricsData, usersData, coursesData] = await Promise.all([
        api.get("/admin/opportunities/pending"),
        api.get("/admin/metrics/summary"),
        api.get("/admin/users"),
        api.get("/admin/courses"),
      ]);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setMetrics(metricsData);
      const usersList = usersData?.items ?? usersData;
      setUsers(Array.isArray(usersList) ? usersList : []);
      setCatalogCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error cargando datos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPublishModal = (opp) => {
    setPublishModal(opp);
    setSelectedCatalogId("");
  };

  const confirmPublish = async () => {
    if (!selectedCatalogId) {
      setStatus({ type: "error", message: "Selecciona un curso del cat\u00e1logo." });
      return;
    }
    try {
      setPublishing(true);
      await api.patch(`/admin/opportunities/${publishModal.id}/publish`, {
        catalog_course_id: Number(selectedCatalogId),
      });
      setPublishModal(null);
      await loadData();
      setStatus({ type: "success", message: "Oportunidad publicada con curso obligatorio." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error al publicar." });
    } finally {
      setPublishing(false);
    }
  };

  /* ── Catálogo CRUD ── */
  const openCreateCourse = () => {
    setCourseModal({ mode: "create" });
    setCourseForm({ name: "", description: "", content_url: "" });
  };

  const openEditCourse = (course) => {
    setCourseModal({ mode: "edit", course });
    setCourseForm({ name: course.name, description: course.description || "", content_url: course.content_url });
  };

  const saveCourse = async () => {
    if (!courseForm.name.trim() || !courseForm.content_url.trim()) {
      setStatus({ type: "error", message: "Nombre y URL son obligatorios." });
      return;
    }
    try {
      setSavingCourse(true);
      if (courseModal.mode === "create") {
        await api.post("/admin/courses", {
          name: courseForm.name.trim(),
          description: courseForm.description.trim() || null,
          content_url: courseForm.content_url.trim(),
        });
        setStatus({ type: "success", message: "Curso creado en el cat\u00e1logo." });
      } else {
        await api.patch(`/admin/courses/${courseModal.course.id}`, {
          name: courseForm.name.trim(),
          description: courseForm.description.trim() || null,
          content_url: courseForm.content_url.trim(),
        });
        setStatus({ type: "success", message: "Curso actualizado." });
      }
      setCourseModal(null);
      const coursesData = await api.get("/admin/courses");
      setCatalogCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error guardando curso." });
    } finally {
      setSavingCourse(false);
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await api.delete(`/admin/courses/${courseId}`);
      const coursesData = await api.get("/admin/courses");
      setCatalogCourses(Array.isArray(coursesData) ? coursesData : []);
      setStatus({ type: "success", message: "Curso desactivado del cat\u00e1logo." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error eliminando curso." });
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const filteredUsers = userFilter ? users.filter((u) => u.role === userFilter) : users;

  const roleBadge = {
    student: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    company: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    admin: "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  /* ═══ UPPER NAV ═══ */
  const navItems = [
    { key: "pending", label: "Pendientes", icon: Clock3, count: pending.length },    { key: "courses", label: "Cat\u00e1logo de Cursos", icon: GraduationCap, count: catalogCourses.length },    { key: "metrics", label: "Métricas", icon: BarChart3, count: null },
    { key: "users", label: "Usuarios", icon: Users, count: users.length },
  ];

  /* ═══ LOWER NAV ═══ */
  const bottomNavItems = [
    { key: "settings", label: "Ajustes", icon: Settings, count: null },
  ];

  return (
    <DashboardLayout
      title="Centro de Control"
      navSection="Administración"
      userName="Administrador"
      userRole="admin"
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={logout}
      statusToast={status}
      onDismissStatus={() => setStatus({ type: "", message: "" })}
      headerActions={
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-all hover:bg-gray-200 dark:hover:bg-white/[0.06]"
        >
          <RefreshCcw className="h-4 w-4" /> Refrescar
        </button>
      }
    >
      {/* ─── Info banner ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3"
      >
        <p className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Panel de administración — curación técnica, métricas y gestión de usuarios.
        </p>
      </motion.div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {/* ══════════ TAB: Pending Opportunities ══════════ */}
          {activeTab === "pending" && (
            <motion.div key="pending" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Oportunidades pendientes</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Revisa, asocia cursos y publica oportunidades.</p>
              </div>

              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No hay oportunidades pendientes de revisión.</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 lg:grid-cols-2">
                  {pending.map((opp) => (
                    <motion.article key={opp.id} variants={fadeUp} className="group overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-500/20 hover:bg-gray-100 dark:hover:bg-white/[0.04]">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">{opp.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{opp.description}</p>
                      {opp.requirements && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-600">Requisitos: {opp.requirements}</p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => openPublishModal(opp)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Aprobar y asignar curso
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Catálogo de Cursos ══════════ */}
          {activeTab === "courses" && (
            <motion.div key="courses" {...tabContent}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Catálogo de Cursos</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                    Gestiona los cursos que se asignan al aprobar oportunidades.
                  </p>
                </div>
                <button
                  onClick={openCreateCourse}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Añadir Nuevo Curso
                </button>
              </div>

              {catalogCourses.length === 0 ? (
                <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    <GraduationCap className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No hay cursos en el catálogo. Crea el primero.</p>
                </motion.div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Nombre</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">URL</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Descripción</th>
                          <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                        {catalogCourses.map((c) => (
                          <tr key={c.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-zinc-200">{c.name}</td>
                            <td className="px-6 py-4">
                              <a href={c.content_url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline truncate block max-w-xs text-xs">
                                {c.content_url}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-zinc-400 text-xs max-w-xs truncate">{c.description || "—"}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => openEditCourse(c)}
                                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteCourse(c.id)}
                                  className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.04] sm:hidden">
                    {catalogCourses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-4 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{c.name}</p>
                          <a href={c.content_url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline truncate block">
                            {c.content_url}
                          </a>
                        </div>
                        <div className="inline-flex items-center gap-1 ml-3 shrink-0">
                          <button onClick={() => openEditCourse(c)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteCourse(c.id)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Metrics Dashboard ══════════ */}
          {activeTab === "metrics" && metrics && (
            <motion.div key="metrics" {...tabContent} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Métricas de la plataforma</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Indicadores clave y embudo de conversión.</p>
              </div>

              {/* KPI row */}
              <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Usuarios", value: metrics.total_users, icon: Users, color: "text-gray-900 dark:text-zinc-100" },
                  { label: "Estudiantes", value: metrics.total_students, icon: Users, color: "text-indigo-400" },
                  { label: "Empresas", value: metrics.total_companies, icon: Users, color: "text-violet-400" },
                  { label: "Unlock Rate", value: metrics.unlock_rate_percent, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", suffix: "%" },
                ].map((kpi) => (
                  <motion.div key={kpi.label} variants={fadeUp} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5">
                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                      <div>
                        <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>
                          <AnimatedNumber value={kpi.value} />{kpi.suffix || ""}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">{kpi.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Opportunity metrics */}
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  Oportunidades (últimos {metrics.window_days} días)
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Creadas", value: metrics.opportunities_created, color: "text-gray-900 dark:text-zinc-100" },
                    { label: "Publicadas", value: metrics.opportunities_published, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Pendientes ahora", value: metrics.pending_opportunities, color: "text-amber-600 dark:text-amber-400" },
                    { label: "Publicadas ahora", value: metrics.published_opportunities, color: "text-emerald-600 dark:text-emerald-400" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 text-center">
                      <p className={`text-3xl font-bold tabular-nums ${m.color}`}>
                        <AnimatedNumber value={m.value} />
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Funnel metrics */}
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Funnel de Postulación</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Cursos completados", value: metrics.course_completions },
                    { label: "Intentos de postulación", value: metrics.apply_attempts },
                    { label: "Postulaciones exitosas", value: metrics.apply_success, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Bloqueadas", value: metrics.apply_blocked, color: "text-rose-600 dark:text-rose-400" },
                    { label: "Tasa de éxito", value: metrics.apply_success_rate_percent, color: "text-emerald-600 dark:text-emerald-400", suffix: "%" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 text-center">
                      <p className={`text-2xl font-bold tabular-nums ${m.color || "text-gray-900 dark:text-zinc-100"}`}>
                        <AnimatedNumber value={m.value} />{m.suffix || ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Visual funnel */}
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Embudo visual</h3>
                <div className="mt-5 space-y-4">
                  {[
                    { label: "Usuarios registrados", value: metrics.total_users, max: metrics.total_users },
                    { label: "Cursos completados", value: metrics.course_completions, max: metrics.total_users },
                    { label: "Postulaciones exitosas", value: metrics.apply_success, max: metrics.total_users },
                  ].map((step, i) => {
                    const pct = step.max > 0 ? Math.round((step.value / step.max) * 100) : 0;
                    return (
                      <div key={step.label}>
                        <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-zinc-500">
                          <span className="font-medium">{step.label}</span>
                          <span className="tabular-nums">{step.value} ({pct}%)</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 2)}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + i * 0.15 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════ TAB: Users ══════════ */}
          {activeTab === "users" && (
            <motion.div key="users" {...tabContent}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Gestión de Usuarios</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">Todos los usuarios registrados en la plataforma.</p>
              </div>

              {/* Filter chips */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-zinc-500">Filtrar:</span>
                {["", "student", "company", "admin"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                      userFilter === filter
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : "border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {filter || "Todos"} ({filter ? users.filter((u) => u.role === filter).length : users.length})
                  </button>
                ))}
              </div>

              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-white/[0.02] p-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                    <Users className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">No hay usuarios con ese filtro.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]">
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">ID</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Email</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Nombre</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Rol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <td className="px-6 py-4 tabular-nums font-mono text-xs text-gray-400 dark:text-zinc-600">{u.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-zinc-200">{u.email}</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-zinc-400">
                              {u.profile_data?.first_name
                                ? `${u.profile_data.first_name} ${u.profile_data.last_name || ""}`
                                : u.profile_data?.company_name || "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role] || "border-zinc-200 dark:border-zinc-600/30 bg-gray-100 dark:bg-zinc-600/10 text-gray-500 dark:text-zinc-500"}`}>
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="divide-y divide-gray-100 dark:divide-white/[0.04] sm:hidden">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-bold tabular-nums text-gray-500 dark:text-zinc-500">
                            {u.id}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{u.email}</p>
                            {u.profile_data?.first_name && (
                              <p className="text-xs text-gray-500 dark:text-zinc-500">
                                {u.profile_data.first_name} {u.profile_data.last_name || ""}
                              </p>
                            )}
                            {u.profile_data?.company_name && (
                              <p className="text-xs text-gray-500 dark:text-zinc-500">{u.profile_data.company_name}</p>
                            )}
                          </div>
                        </div>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role] || "border-zinc-200 dark:border-zinc-600/30 bg-gray-100 dark:bg-zinc-600/10 text-gray-500 dark:text-zinc-500"}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════ TAB: Ajustes ══════════ */}
          {activeTab === "settings" && (
            <motion.div key="settings" {...tabContent}>
              <SettingsPanel role="admin" profile={null} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ═══════ Modal: Asignar curso y publicar (Dropdown) ═══════ */}
      <AnimatePresence>
        {publishModal && (
          <motion.div
            key="publish-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setPublishModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Aprobar oportunidad</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">
                    Selecciona un curso del catálogo para asignar como requisito obligatorio.
                  </p>
                </div>
                <button
                  onClick={() => setPublishModal(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Opportunity info */}
              <div className="px-6 pt-5">
                <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{publishModal.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-zinc-500">{publishModal.description}</p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="px-6 pt-5 pb-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Curso obligatorio <span className="text-rose-500">*</span>
                </label>
                {catalogCourses.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                    No hay cursos en el catálogo. Crea uno en la pestaña "Catálogo de Cursos" primero.
                  </div>
                ) : (
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => setSelectedCatalogId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                  >
                    <option value="">— Selecciona un curso —</option>
                    {catalogCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                {selectedCatalogId && (() => {
                  const sel = catalogCourses.find((c) => c.id === Number(selectedCatalogId));
                  return sel ? (
                    <div className="mt-3 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">{sel.name}</p>
                      {sel.description && <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">{sel.description}</p>}
                      <a href={sel.content_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-emerald-600 dark:text-emerald-400 hover:underline truncate max-w-full">
                        {sel.content_url}
                      </a>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <button
                  onClick={() => setPublishModal(null)}
                  className="rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-all hover:bg-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPublish}
                  disabled={publishing || !selectedCatalogId}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {publishing ? "Publicando…" : "Publicar oportunidad"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Modal: Crear / Editar curso del catálogo ═══════ */}
      <AnimatePresence>
        {courseModal && (
          <motion.div
            key="course-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setCourseModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  {courseModal.mode === "create" ? "Nuevo Curso" : "Editar Curso"}
                </h3>
                <button
                  onClick={() => setCourseModal(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4 px-6 pt-5 pb-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Nombre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Fundamentos de React"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    URL del contenido <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={courseForm.content_url}
                    onChange={(e) => setCourseForm((f) => ({ ...f, content_url: e.target.value }))}
                    placeholder="https://curso.com/modulo"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Descripción <span className="text-xs font-normal text-gray-400 dark:text-zinc-600">(opcional)</span>
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Breve descripción del curso…"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-emerald-400 dark:focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <button
                  onClick={() => setCourseModal(null)}
                  className="rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-all hover:bg-gray-200 dark:hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCourse}
                  disabled={savingCourse || !courseForm.name.trim() || !courseForm.content_url.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {savingCourse ? "Guardando…" : courseModal.mode === "create" ? "Crear curso" : "Guardar cambios"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
