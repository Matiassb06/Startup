import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookCheck,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { clearSession } from "../lib/session";

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
      <div className="shimmer-skeleton h-16 rounded-2xl" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer-skeleton h-12 flex-1" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => <div key={i} className="shimmer-skeleton h-56" />)}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [courseDraft, setCourseDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeTab, setActiveTab] = useState("pending");
  const [userFilter, setUserFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingData, metricsData, usersData] = await Promise.all([
        api.get("/admin/opportunities/pending"),
        api.get("/admin/metrics/summary?window_days=30"),
        api.get("/admin/users"),
      ]);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setMetrics(metricsData);
      setUsers(Array.isArray(usersData?.items) ? usersData.items : Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error cargando datos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveCourse = async (opportunityId) => {
    const contentUrl = (courseDraft[opportunityId] || "").trim();
    if (!contentUrl) {
      setStatus({ type: "error", message: "Debes ingresar URL del curso." });
      return;
    }
    try {
      await api.patch(`/admin/opportunities/${opportunityId}/course`, {
        content_url: contentUrl,
        quiz_data: {},
      });
      setStatus({ type: "success", message: "Curso asociado correctamente." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error guardando curso." });
    }
  };

  const publish = async (opportunityId) => {
    try {
      await api.patch(`/admin/opportunities/${opportunityId}/publish`, {});
      await loadData();
      setStatus({ type: "success", message: "Oportunidad publicada." });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error al publicar." });
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const filteredUsers = userFilter ? users.filter((u) => u.role === userFilter) : users;

  const roleBadge = {
    student: "bg-indigo-500/15 text-indigo-300",
    company: "bg-violet-500/15 text-violet-300",
    admin: "bg-rose-500/15 text-rose-300",
  };

  const tabs = [
    { key: "pending", label: "Pendientes", icon: Clock3, count: pending.length },
    { key: "metrics", label: "Métricas", icon: BarChart3, count: null },
    { key: "users", label: "Usuarios", icon: Users, count: users.length },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 tech-grid-bg" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      {/* ─── Decorative Orbs ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-rose-500/[0.04] blur-[120px] animate-float" />
        <div className="absolute -right-40 top-2/3 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.06] blur-[100px] animate-float-delayed" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-rose-400/70">
              <Sparkles className="h-3 w-3" /> Admin Dashboard
            </p>
            <h1 className="mt-0.5 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-xl font-bold text-transparent">
              Centro de Control
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 px-4 py-2 text-sm font-medium transition-all hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
            >
              <RefreshCcw className="h-4 w-4" /> Refrescar
            </button>
            <Link
              to="/"
              className="rounded-xl border border-zinc-700/60 px-4 py-2 text-sm font-medium transition-all hover:border-indigo-400/40"
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
        <div className="glow-line h-[1px] w-full bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── Info bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          <p className="inline-flex items-center gap-2 text-sm text-indigo-300/80">
            <ShieldCheck className="h-4 w-4" /> Panel de administración — curación técnica, métricas y gestión de usuarios.
          </p>
        </motion.div>

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
          transition={{ duration: 0.3, delay: 0.1 }}
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
                  layoutId="admin-tab"
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
            {/* ══════ TAB: Pending Opportunities ══════ */}
            {activeTab === "pending" && (
              <motion.div key="pending" {...tabContent}>
                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-16 text-center backdrop-blur-xl">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                    </div>
                    <p className="text-zinc-500">No hay oportunidades pendientes de revisión.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 lg:grid-cols-2">
                    {pending.map((opp) => (
                      <motion.article
                        key={opp.id}
                        variants={fadeUp}
                        className="card-glow group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                      >
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent transition-all duration-500 group-hover:via-amber-500/40" />
                        <h2 className="text-lg font-semibold text-white">{opp.title}</h2>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300/80">{opp.description}</p>
                        {opp.requirements && (
                          <p className="mt-1 text-xs text-zinc-500">Requisitos: {opp.requirements}</p>
                        )}

                        <div className="mt-5 space-y-2">
                          <label className="text-xs uppercase tracking-wider text-zinc-500">URL del curso</label>
                          <input
                            value={courseDraft[opp.id] ?? ""}
                            onChange={(e) => setCourseDraft((prev) => ({ ...prev, [opp.id]: e.target.value }))}
                            placeholder="https://curso.com/modulo"
                            className="w-full rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-400/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => saveCourse(opp.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-950/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:border-indigo-400/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          >
                            <BookCheck className="h-4 w-4" /> Guardar curso
                          </button>
                          <button
                            onClick={() => publish(opp.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Publicar
                          </button>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ══════ TAB: Metrics Dashboard ══════ */}
            {activeTab === "metrics" && metrics && (
              <motion.div key="metrics" {...tabContent} className="space-y-6">
                {/* KPI row */}
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total Usuarios", value: metrics.total_users, icon: Users, color: "text-white" },
                    { label: "Estudiantes", value: metrics.total_students, icon: Users, color: "text-indigo-400" },
                    { label: "Empresas", value: metrics.total_companies, icon: Users, color: "text-violet-400" },
                    { label: "Unlock Rate", value: metrics.unlock_rate_percent, icon: TrendingUp, color: "text-emerald-400", suffix: "%" },
                  ].map((kpi) => (
                    <motion.div
                      key={kpi.label}
                      variants={fadeUp}
                      className="card-glow group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-xl"
                    >
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/0 to-transparent transition-all duration-500 group-hover:via-zinc-600/50" />
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/50">
                          <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>
                            <AnimatedNumber value={kpi.value} />{kpi.suffix || ""}
                          </p>
                          <p className="text-xs text-zinc-500">{kpi.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Opportunity metrics */}
                <motion.div
                  {...fadeUp}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                  <h3 className="text-lg font-semibold text-white">Oportunidades (últimos {metrics.window_days} días)</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Creadas", value: metrics.opportunities_created, color: "text-zinc-200" },
                      { label: "Publicadas", value: metrics.opportunities_published, color: "text-emerald-400" },
                      { label: "Pendientes ahora", value: metrics.pending_opportunities, color: "text-amber-400" },
                      { label: "Publicadas ahora", value: metrics.published_opportunities, color: "text-indigo-400" },
                    ].map((m) => (
                      <div key={m.label} className="card-glow rounded-xl border border-zinc-700/40 bg-zinc-800/30 p-4 text-center">
                        <p className={`text-3xl font-bold tabular-nums ${m.color}`}>
                          <AnimatedNumber value={m.value} />
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Funnel metrics */}
                <motion.div
                  {...fadeUp}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                  <h3 className="text-lg font-semibold text-white">Funnel de Postulación</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: "Cursos completados", value: metrics.course_completions },
                      { label: "Intentos de postulación", value: metrics.apply_attempts },
                      { label: "Postulaciones exitosas", value: metrics.apply_success, color: "text-emerald-400" },
                      { label: "Bloqueadas", value: metrics.apply_blocked, color: "text-rose-400" },
                      { label: "Tasa de éxito", value: metrics.apply_success_rate_percent, color: "text-indigo-400", suffix: "%" },
                    ].map((m) => (
                      <div key={m.label} className="card-glow rounded-xl border border-zinc-700/40 bg-zinc-800/30 p-4 text-center">
                        <p className={`text-2xl font-bold tabular-nums ${m.color || "text-white"}`}>
                          <AnimatedNumber value={m.value} />{m.suffix || ""}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Visual funnel */}
                <motion.div
                  {...fadeUp}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                  <h3 className="text-lg font-semibold text-white">Embudo visual</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      { label: "Usuarios registrados", value: metrics.total_users, max: metrics.total_users },
                      { label: "Cursos completados", value: metrics.course_completions, max: metrics.total_users },
                      { label: "Postulaciones exitosas", value: metrics.apply_success, max: metrics.total_users },
                    ].map((step, i) => {
                      const pct = step.max > 0 ? Math.round((step.value / step.max) * 100) : 0;
                      return (
                        <div key={step.label}>
                          <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
                            <span>{step.label}</span>
                            <span className="tabular-nums">
                              {step.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-zinc-800/80">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(pct, 2)}%` }}
                              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + i * 0.15 }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ══════ TAB: Users ══════ */}
            {activeTab === "users" && (
              <motion.div key="users" {...tabContent}>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-zinc-500">Filtrar:</span>
                  {["", "student", "company", "admin"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserFilter(filter)}
                      className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                        userFilter === filter
                          ? "bg-indigo-500/15 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                          : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      {filter || "Todos"} ({filter ? users.filter((u) => u.role === filter).length : users.length})
                    </button>
                  ))}
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-12 text-center backdrop-blur-xl">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                      <Users className="h-8 w-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500">No hay usuarios con ese filtro.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
                    {filteredUsers.map((u) => (
                      <motion.div
                        key={u.id}
                        variants={fadeUp}
                        className="card-glow group flex items-center justify-between rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4 backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/60 text-xs font-bold tabular-nums text-zinc-400 transition-colors group-hover:bg-zinc-800 group-hover:text-zinc-300">
                            {u.id}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.email}</p>
                            {u.profile_data?.first_name && (
                              <p className="text-xs text-zinc-500">
                                {u.profile_data.first_name} {u.profile_data.last_name || ""}
                              </p>
                            )}
                            {u.profile_data?.company_name && (
                              <p className="text-xs text-zinc-500">{u.profile_data.company_name}</p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadge[u.role] || "bg-zinc-800 text-zinc-400"}`}
                        >
                          {u.role}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
