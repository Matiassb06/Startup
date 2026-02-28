import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookCheck,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
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

/* ───── Loading Skeleton ───── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-14 animate-pulse rounded-xl bg-white/5" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

/* ───── "Coming Soon" Placeholder ───── */
function ComingSoon({ icon: Icon, title, description }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
        <Icon className="h-7 w-7 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
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
  const [courseDraft, setCourseDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeTab, setActiveTab] = useState("pending");
  const [userFilter, setUserFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingData, metricsData, usersData] = await Promise.all([
        api.get("/admin/opportunities/pending"),
        api.get("/admin/metrics/summary"),
        api.get("/admin/users"),
      ]);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setMetrics(metricsData);
      const usersList = usersData?.items ?? usersData;
      setUsers(Array.isArray(usersList) ? usersList : []);
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
    student: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    company: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    admin: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  };

  /* ═══ UPPER NAV ═══ */
  const navItems = [
    { key: "pending", label: "Pendientes", icon: Clock3, count: pending.length },
    { key: "metrics", label: "Métricas", icon: BarChart3, count: null },
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
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/[0.06]"
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
        className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
      >
        <p className="inline-flex items-center gap-2 text-sm text-emerald-400">
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
                <h2 className="text-lg font-semibold text-zinc-100">Oportunidades pendientes</h2>
                <p className="mt-1 text-sm text-zinc-500">Revisa, asocia cursos y publica oportunidades.</p>
              </div>

              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-white/[0.02] p-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-sm text-zinc-500">No hay oportunidades pendientes de revisión.</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-5 lg:grid-cols-2">
                  {pending.map((opp) => (
                    <motion.article key={opp.id} variants={fadeUp} className="group overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-emerald-500/20 hover:bg-white/[0.04]">
                      <h2 className="text-base font-semibold text-zinc-100">{opp.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{opp.description}</p>
                      {opp.requirements && (
                        <p className="mt-1 text-xs text-zinc-600">Requisitos: {opp.requirements}</p>
                      )}

                      <div className="mt-5 space-y-2">
                        <label className="block text-sm font-medium text-zinc-300">URL del curso</label>
                        <input
                          value={courseDraft[opp.id] ?? ""}
                          onChange={(e) => setCourseDraft((prev) => ({ ...prev, [opp.id]: e.target.value }))}
                          placeholder="https://curso.com/modulo"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => saveCourse(opp.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.06]"
                        >
                          <BookCheck className="h-4 w-4" /> Guardar curso
                        </button>
                        <button
                          onClick={() => publish(opp.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
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

          {/* ══════════ TAB: Metrics Dashboard ══════════ */}
          {activeTab === "metrics" && metrics && (
            <motion.div key="metrics" {...tabContent} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Métricas de la plataforma</h2>
                <p className="mt-1 text-sm text-zinc-500">Indicadores clave y embudo de conversión.</p>
              </div>

              {/* KPI row */}
              <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Usuarios", value: metrics.total_users, icon: Users, color: "text-zinc-100" },
                  { label: "Estudiantes", value: metrics.total_students, icon: Users, color: "text-indigo-400" },
                  { label: "Empresas", value: metrics.total_companies, icon: Users, color: "text-violet-400" },
                  { label: "Unlock Rate", value: metrics.unlock_rate_percent, icon: TrendingUp, color: "text-emerald-400", suffix: "%" },
                ].map((kpi) => (
                  <motion.div key={kpi.label} variants={fadeUp} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
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
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-zinc-100">
                  Oportunidades (últimos {metrics.window_days} días)
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Creadas", value: metrics.opportunities_created, color: "text-zinc-100" },
                    { label: "Publicadas", value: metrics.opportunities_published, color: "text-emerald-400" },
                    { label: "Pendientes ahora", value: metrics.pending_opportunities, color: "text-amber-400" },
                    { label: "Publicadas ahora", value: metrics.published_opportunities, color: "text-emerald-400" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <p className={`text-3xl font-bold tabular-nums ${m.color}`}>
                        <AnimatedNumber value={m.value} />
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Funnel metrics */}
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-zinc-100">Funnel de Postulación</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Cursos completados", value: metrics.course_completions },
                    { label: "Intentos de postulación", value: metrics.apply_attempts },
                    { label: "Postulaciones exitosas", value: metrics.apply_success, color: "text-emerald-400" },
                    { label: "Bloqueadas", value: metrics.apply_blocked, color: "text-rose-400" },
                    { label: "Tasa de éxito", value: metrics.apply_success_rate_percent, color: "text-emerald-400", suffix: "%" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                      <p className={`text-2xl font-bold tabular-nums ${m.color || "text-zinc-100"}`}>
                        <AnimatedNumber value={m.value} />{m.suffix || ""}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Visual funnel */}
              <motion.div {...fadeUp} className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-zinc-100">Embudo visual</h3>
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
                          <span className="font-medium">{step.label}</span>
                          <span className="tabular-nums">{step.value} ({pct}%)</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white/5">
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
                <h2 className="text-lg font-semibold text-zinc-100">Gestión de Usuarios</h2>
                <p className="mt-1 text-sm text-zinc-500">Todos los usuarios registrados en la plataforma.</p>
              </div>

              {/* Filter chips */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-zinc-500">Filtrar:</span>
                {["", "student", "company", "admin"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                      userFilter === filter
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : "border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    {filter || "Todos"} ({filter ? users.filter((u) => u.role === filter).length : users.length})
                  </button>
                ))}
              </div>

              {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-white/[0.02] p-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5">
                    <Users className="h-7 w-7 text-zinc-500" />
                  </div>
                  <p className="text-sm text-zinc-500">No hay usuarios con ese filtro.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  {/* Desktop table */}
                  <div className="hidden sm:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Nombre</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Rol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                            <td className="px-6 py-4 tabular-nums font-mono text-xs text-zinc-600">{u.id}</td>
                            <td className="px-6 py-4 font-medium text-zinc-200">{u.email}</td>
                            <td className="px-6 py-4 text-zinc-400">
                              {u.profile_data?.first_name
                                ? `${u.profile_data.first_name} ${u.profile_data.last_name || ""}`
                                : u.profile_data?.company_name || "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role] || "border-zinc-600/30 bg-zinc-600/10 text-zinc-500"}`}>
                                {u.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="divide-y divide-white/[0.04] sm:hidden">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-xs font-bold tabular-nums text-zinc-500">
                            {u.id}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{u.email}</p>
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
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleBadge[u.role] || "border-zinc-600/30 bg-zinc-600/10 text-zinc-500"}`}>
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
              <ComingSoon
                icon={Settings}
                title="Ajustes del Sistema"
                description="Aquí podrás configurar parámetros de la plataforma, gestionar roles y preferencias del sistema. Esta funcionalidad estará disponible pronto."
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
}
