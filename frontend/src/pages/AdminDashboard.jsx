import {
  BarChart3,
  BookCheck,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { clearSession } from "../lib/session";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Admin Dashboard</p>
            <h1 className="text-xl font-semibold">Centro de Control</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50"
            >
              <RefreshCcw className="h-4 w-4" /> Refrescar
            </button>
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
        {/* Status info bar */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="inline-flex items-center gap-2 text-sm text-indigo-300">
            <ShieldCheck className="h-4 w-4" /> Panel de administración — curación técnica, métricas y gestión de usuarios.
          </p>
        </div>

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
            {/* ══════ TAB: Pending Opportunities ══════ */}
            {activeTab === "pending" && (
              <>
                {pending.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center text-zinc-400">
                    No hay oportunidades pendientes de revisión.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {pending.map((opp) => (
                      <article key={opp.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
                        <h2 className="text-lg font-semibold text-white">{opp.title}</h2>
                        <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{opp.description}</p>
                        {opp.requirements && (
                          <p className="mt-1 text-xs text-zinc-500">Requisitos: {opp.requirements}</p>
                        )}

                        <div className="mt-4 space-y-2">
                          <label className="text-xs uppercase tracking-wider text-zinc-400">URL del curso</label>
                          <input
                            value={courseDraft[opp.id] ?? ""}
                            onChange={(e) => setCourseDraft((prev) => ({ ...prev, [opp.id]: e.target.value }))}
                            placeholder="https://curso.com/modulo"
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => saveCourse(opp.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-indigo-400/60"
                          >
                            <BookCheck className="h-4 w-4" /> Guardar curso
                          </button>
                          <button
                            onClick={() => publish(opp.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Publicar
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ══════ TAB: Metrics Dashboard ══════ */}
            {activeTab === "metrics" && metrics && (
              <div className="space-y-6">
                {/* KPI row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total Usuarios", value: metrics.total_users, icon: Users, color: "text-white" },
                    { label: "Estudiantes", value: metrics.total_students, icon: Users, color: "text-indigo-400" },
                    { label: "Empresas", value: metrics.total_companies, icon: Users, color: "text-violet-400" },
                    { label: "Unlock Rate", value: `${metrics.unlock_rate_percent}%`, icon: TrendingUp, color: "text-emerald-400" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                      <div className="flex items-center gap-3">
                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        <div>
                          <p className={`text-2xl font-semibold ${kpi.color}`}>{kpi.value}</p>
                          <p className="text-xs text-zinc-400">{kpi.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opportunity metrics */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Oportunidades (últimos {metrics.window_days} días)</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Creadas", value: metrics.opportunities_created, color: "text-zinc-200" },
                      { label: "Publicadas", value: metrics.opportunities_published, color: "text-emerald-400" },
                      { label: "Pendientes ahora", value: metrics.pending_opportunities, color: "text-amber-400" },
                      { label: "Publicadas ahora", value: metrics.published_opportunities, color: "text-indigo-400" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 text-center">
                        <p className={`text-3xl font-semibold ${m.color}`}>{m.value}</p>
                        <p className="mt-1 text-xs text-zinc-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funnel metrics */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Funnel de Postulación</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: "Cursos completados", value: metrics.course_completions },
                      { label: "Intentos de postulación", value: metrics.apply_attempts },
                      { label: "Postulaciones exitosas", value: metrics.apply_success, color: "text-emerald-400" },
                      { label: "Bloqueadas", value: metrics.apply_blocked, color: "text-rose-400" },
                      { label: "Tasa de éxito", value: `${metrics.apply_success_rate_percent}%`, color: "text-indigo-400" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4 text-center">
                        <p className={`text-2xl font-semibold ${m.color || "text-white"}`}>{m.value}</p>
                        <p className="mt-1 text-xs text-zinc-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual funnel */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
                  <h3 className="text-lg font-semibold text-white">Embudo visual</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Usuarios registrados", value: metrics.total_users, max: metrics.total_users },
                      { label: "Cursos completados", value: metrics.course_completions, max: metrics.total_users },
                      { label: "Postulaciones exitosas", value: metrics.apply_success, max: metrics.total_users },
                    ].map((step) => {
                      const pct = step.max > 0 ? Math.round((step.value / step.max) * 100) : 0;
                      return (
                        <div key={step.label}>
                          <div className="mb-1 flex justify-between text-xs text-zinc-400">
                            <span>{step.label}</span>
                            <span>
                              {step.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-zinc-800">
                            <div
                              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══════ TAB: Users ══════ */}
            {activeTab === "users" && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Filtrar:</span>
                  {["", "student", "company", "admin"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setUserFilter(filter)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        userFilter === filter
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {filter || "Todos"} {filter ? `(${users.filter((u) => u.role === filter).length})` : `(${users.length})`}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-400">
                      No hay usuarios con ese filtro.
                    </div>
                  ) : null}
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300">
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
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge[u.role] || "bg-zinc-800 text-zinc-400"}`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
