import { BookOpen, BriefcaseBusiness, CheckCircle2, LogOut, Send, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { API_BASE } from "../lib/config";
import { clearSession, getSession, mergeSession } from "../lib/session";

export function StudentDashboard() {
  const [studentId, setStudentId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  const fetchOpportunities = async (id) => {
    const response = await fetch(`${API_BASE}/students/${id}/opportunities/`);
    if (!response.ok) {
      throw new Error("No se pudieron cargar tus vacantes.");
    }
    const payload = await response.json();
    setOpportunities(Array.isArray(payload) ? payload : []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const current = getSession();
        const email = current?.email || `student.${Date.now()}@train.com`;
        const response = await fetch(`${API_BASE}/users/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password_hash: "demo_student_profile",
            role: "student",
            profile_data: { source: "student_dashboard" },
          }),
        });
        if (!response.ok) throw new Error("No se pudo iniciar perfil de estudiante.");

        const payload = await response.json();
        const resolvedId = payload.user_id ?? payload.id;
        mergeSession({ role: "student", userId: resolvedId, email });
        setStudentId(resolvedId);
        await fetchOpportunities(resolvedId);
      } catch (error) {
        setStatus({ type: "error", message: error instanceof Error ? error.message : "Error inesperado." });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const completeCourse = async (opportunity) => {
    if (!opportunity.course_id || !studentId) {
      setStatus({ type: "error", message: "Esta vacante aún no tiene curso asociado." });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/courses/${opportunity.course_id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId, score: 100 }),
      });
      if (!response.ok) throw new Error("No se pudo completar el curso.");

      await fetchOpportunities(studentId);
      setStatus({ type: "success", message: "Curso completado. Postulación desbloqueada ✅" });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error al completar curso." });
    }
  };

  const apply = async (opportunityId) => {
    if (!studentId) return;

    try {
      const response = await fetch(`${API_BASE}/apply/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId, opportunity_id: opportunityId }),
      });

      if (response.ok) {
        const payload = await response.json().catch(() => null);
        setStatus({ type: "success", message: payload?.message || "Postulación enviada." });
        return;
      }

      if (response.status === 403) {
        setStatus({ type: "error", message: "Debes completar el curso para postular." });
        return;
      }

      const payload = await response.json().catch(() => null);
      setStatus({ type: "error", message: payload?.detail || "No se pudo postular." });
    } catch {
      setStatus({ type: "error", message: "Error de red al postular." });
    }
  };

  const logout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">Student Dashboard</p>
            <h1 className="text-xl font-semibold">Vacantes y Gatekeeper</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-indigo-400/50">Inicio</Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {status.message ? (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}>
            {status.message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-zinc-300">Cargando vacantes...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {opportunities.map((opportunity) => {
              const canApply = Boolean(opportunity.can_apply);
              const progress = Number(opportunity.progress_percent ?? 0);
              return (
                <article key={opportunity.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{opportunity.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{opportunity.company_name}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${canApply ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border border-amber-400/40 bg-amber-500/10 text-amber-300"}`}>
                      {canApply ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                      {canApply ? "Unlocked" : "Locked"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300">{opportunity.description}</p>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-zinc-400">
                      <span>Progreso</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => completeCourse(opportunity)}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-indigo-400/50"
                    >
                      <BookOpen className="h-4 w-4" /> Completar curso
                    </button>
                    <button
                      disabled={!canApply}
                      onClick={() => apply(opportunity.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${canApply ? "bg-indigo-500 text-white hover:bg-indigo-400" : "cursor-not-allowed bg-zinc-800 text-zinc-400"}`}
                    >
                      <BriefcaseBusiness className="h-4 w-4" />
                      Postular
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
