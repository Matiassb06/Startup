import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const featureCards = [
  {
    title: "Aprende",
    description: "Cursos específicos creados por empresas para roles reales y habilidades demandadas.",
    emoji: "📚",
  },
  {
    title: "Valida",
    description: "Aprueba el examen técnico y demuestra evidencia objetiva de tu nivel.",
    emoji: "✅",
  },
  {
    title: "Postula",
    description: "Desbloquea el botón de postulación automáticamente al completar el entrenamiento.",
    emoji: "🚀",
  },
];

export default function App() {
  const [adminId, setAdminId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true);
  const [opportunityError, setOpportunityError] = useState("");
  const [actionStatus, setActionStatus] = useState({ type: "", message: "" });

  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState({ type: "", message: "" });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [pendingOpportunities, setPendingOpportunities] = useState([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [adminStatus, setAdminStatus] = useState({ type: "", message: "" });
  const [courseDraftByOpportunity, setCourseDraftByOpportunity] = useState({});
  const [companyOpportunities, setCompanyOpportunities] = useState([]);
  const [isLoadingCompanyOps, setIsLoadingCompanyOps] = useState(false);
  const [companyStatus, setCompanyStatus] = useState({ type: "", message: "" });
  const [companyForm, setCompanyForm] = useState({ title: "", description: "", requirements: "" });

  useEffect(() => {
    const bootstrapStudent = async () => {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@train.com",
          password_hash: "demo_password_hash",
          role: "student",
          profile_data: { source: "landing_phase1" },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo inicializar el perfil de estudiante.");
      }

      const payload = await response.json();
      const resolvedId = payload.user_id ?? payload.id;
      if (!resolvedId) {
        throw new Error("El backend no devolvió el ID del estudiante.");
      }

      setStudentId(resolvedId);
      return resolvedId;
    };

    const bootstrapAdmin = async () => {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@train.com",
          password_hash: "demo_admin_hash",
          role: "admin",
          profile_data: { source: "landing_phase1_admin" },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo inicializar el perfil admin.");
      }

      const payload = await response.json();
      const resolvedId = payload.user_id ?? payload.id;
      if (!resolvedId) {
        throw new Error("El backend no devolvió el ID del admin.");
      }

      setAdminId(resolvedId);
      return resolvedId;
    };

    const bootstrapCompany = async () => {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "acme@company.com",
          password_hash: "demo_company_hash",
          role: "company",
          profile_data: { source: "landing_phase1_company" },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo inicializar el perfil de empresa.");
      }

      const payload = await response.json();
      const resolvedId = payload.user_id ?? payload.id;
      if (!resolvedId) {
        throw new Error("El backend no devolvió el ID de empresa.");
      }

      setCompanyId(resolvedId);
      return resolvedId;
    };

    const loadPendingOpportunities = async (resolvedAdminId) => {
      setIsLoadingPending(true);
      try {
        const response = await fetch(`${API_BASE}/admin/opportunities/pending?admin_id=${resolvedAdminId}`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar las oportunidades pendientes.");
        }
        const payload = await response.json();
        setPendingOpportunities(Array.isArray(payload) ? payload : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar pendientes.";
        setAdminStatus({ type: "error", message });
      } finally {
        setIsLoadingPending(false);
      }
    };

    const loadCompanyOpportunities = async (resolvedCompanyId) => {
      setIsLoadingCompanyOps(true);
      try {
        const response = await fetch(`${API_BASE}/company/opportunities/?company_id=${resolvedCompanyId}`);
        if (!response.ok) {
          throw new Error("No se pudieron cargar tus oportunidades de empresa.");
        }
        const payload = await response.json();
        setCompanyOpportunities(Array.isArray(payload) ? payload : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar oportunidades de empresa.";
        setCompanyStatus({ type: "error", message });
      } finally {
        setIsLoadingCompanyOps(false);
      }
    };

    const loadOpportunities = async (resolvedStudentId) => {
      setIsLoadingOpportunities(true);
      setOpportunityError("");

      try {
        const response = await fetch(`${API_BASE}/students/${resolvedStudentId}/opportunities/`);
        if (!response.ok) {
          throw new Error("No pudimos cargar las vacantes en este momento.");
        }

        const payload = await response.json();
        setOpportunities(Array.isArray(payload) ? payload : []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error inesperado al cargar vacantes.";
        setOpportunityError(message);
      } finally {
        setIsLoadingOpportunities(false);
      }
    };

    const bootstrap = async () => {
      try {
        const resolvedStudentId = await bootstrapStudent();
        const resolvedAdminId = await bootstrapAdmin();
        const resolvedCompanyId = await bootstrapCompany();
        await loadOpportunities(resolvedStudentId);
        await loadPendingOpportunities(resolvedAdminId);
        await loadCompanyOpportunities(resolvedCompanyId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error inesperado al iniciar.";
        setOpportunityError(message);
        setIsLoadingOpportunities(false);
      }
    };

    bootstrap();
  }, []);

  const visibleOpportunities = useMemo(() => opportunities.slice(0, 9), [opportunities]);

  const scrollToOpportunities = () => {
    const target = document.getElementById("opportunities");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCompanyCTA = () => {
    window.alert("Gracias por tu interés. Muy pronto habilitaremos el portal para empresas.");
  };

  const refreshStudentOpportunities = async () => {
    if (!studentId) {
      return;
    }

    const response = await fetch(`${API_BASE}/students/${studentId}/opportunities/`);
    if (!response.ok) {
      throw new Error("No se pudieron actualizar las vacantes del estudiante.");
    }
    const payload = await response.json();
    setOpportunities(Array.isArray(payload) ? payload : []);
  };

  const refreshPendingOpportunities = async () => {
    if (!adminId) {
      return;
    }

    const response = await fetch(`${API_BASE}/admin/opportunities/pending?admin_id=${adminId}`);
    if (!response.ok) {
      throw new Error("No se pudo actualizar la lista pendiente.");
    }

    const payload = await response.json();
    setPendingOpportunities(Array.isArray(payload) ? payload : []);
  };

  const refreshCompanyOpportunities = async () => {
    if (!companyId) {
      return;
    }

    const response = await fetch(`${API_BASE}/company/opportunities/?company_id=${companyId}`);
    if (!response.ok) {
      throw new Error("No se pudo actualizar la lista de empresa.");
    }

    const payload = await response.json();
    setCompanyOpportunities(Array.isArray(payload) ? payload : []);
  };

  const handleWatchCourse = async (opportunity) => {
    if (!studentId) {
      setActionStatus({ type: "error", message: "No se encontró el estudiante activo." });
      return;
    }

    if (!opportunity.course_id) {
      setActionStatus({ type: "error", message: "Esta vacante aún no tiene curso asociado." });
      return;
    }

    setActionStatus({ type: "", message: "" });
    try {
      const response = await fetch(`${API_BASE}/courses/${opportunity.course_id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId, score: 100 }),
      });

      if (!response.ok) {
        throw new Error("No se pudo completar el curso.");
      }

      await refreshStudentOpportunities();
      setActionStatus({ type: "success", message: "Course completed. Apply unlocked ✅" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al completar el curso.";
      setActionStatus({ type: "error", message });
    }
  };

  const handleApply = async (opportunityId) => {
    if (!studentId) {
      setActionStatus({ type: "error", message: "No se encontró el estudiante activo." });
      return;
    }

    setActionStatus({ type: "", message: "" });
    try {
      const response = await fetch(`${API_BASE}/apply/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId, opportunity_id: opportunityId }),
      });

      if (response.ok) {
        const payload = await response.json().catch(() => null);
        setActionStatus({ type: "success", message: payload?.message ?? "Application sent 🎉" });
        return;
      }

      if (response.status === 403) {
        setActionStatus({ type: "error", message: "⛔ ACCESS DENIED: You must complete the course first." });
        return;
      }

      const payload = await response.json().catch(() => null);
      setActionStatus({ type: "error", message: payload?.detail ?? "No se pudo postular." });
    } catch {
      setActionStatus({ type: "error", message: "Error de red al postular." });
    }
  };

  const handleLeadSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = leadEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setLeadStatus({ type: "error", message: "Ingresa un correo válido." });
      return;
    }

    setIsSubmittingLead(true);
    setLeadStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password_hash: "waitlist_lead",
          role: "student",
          profile_data: { source: "landing_waitlist" },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar tu correo en la waitlist.");
      }

      setLeadStatus({ type: "success", message: "¡Listo! Te avisaremos cuando publiquemos nuevas vacantes." });
      setLeadEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al registrar tu correo.";
      setLeadStatus({ type: "error", message });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleCourseDraftChange = (opportunityId, value) => {
    setCourseDraftByOpportunity((prev) => ({
      ...prev,
      [opportunityId]: value,
    }));
  };

  const handleSaveCourse = async (opportunityId) => {
    if (!adminId) {
      setAdminStatus({ type: "error", message: "Admin no inicializado." });
      return;
    }

    const contentUrl = (courseDraftByOpportunity[opportunityId] || "").trim();
    if (!contentUrl) {
      setAdminStatus({ type: "error", message: "Ingresa la URL del curso antes de guardar." });
      return;
    }

    setAdminStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/admin/opportunities/${opportunityId}/course`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          content_url: contentUrl,
          quiz_data: {},
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el curso asociado.");
      }

      setAdminStatus({ type: "success", message: "Curso guardado correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar curso.";
      setAdminStatus({ type: "error", message });
    }
  };

  const handlePublishOpportunity = async (opportunityId) => {
    if (!adminId) {
      setAdminStatus({ type: "error", message: "Admin no inicializado." });
      return;
    }

    setAdminStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/admin/opportunities/${opportunityId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });

      if (!response.ok) {
        throw new Error("No se pudo publicar la oportunidad.");
      }

      await Promise.all([refreshPendingOpportunities(), refreshStudentOpportunities(), refreshCompanyOpportunities()]);
      setAdminStatus({ type: "success", message: "Oportunidad publicada ✅" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al publicar oportunidad.";
      setAdminStatus({ type: "error", message });
    }
  };

  const handleCompanyFormChange = (field, value) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCompanyOpportunity = async (event) => {
    event.preventDefault();

    if (!companyId) {
      setCompanyStatus({ type: "error", message: "Empresa no inicializada." });
      return;
    }

    if (!companyForm.title.trim() || !companyForm.description.trim()) {
      setCompanyStatus({ type: "error", message: "Título y descripción son obligatorios." });
      return;
    }

    setCompanyStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/company/opportunities/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_user_id: companyId,
          title: companyForm.title.trim(),
          description: companyForm.description.trim(),
          requirements: companyForm.requirements.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear la oportunidad de empresa.");
      }

      setCompanyForm({ title: "", description: "", requirements: "" });
      await Promise.all([refreshCompanyOpportunities(), refreshPendingOpportunities()]);
      setCompanyStatus({ type: "success", message: "Oportunidad creada en pending_review." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear oportunidad.";
      setCompanyStatus({ type: "error", message });
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.2),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.15),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <p className="inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Train-to-Hire
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-5xl">
            Demuestra tu talento, desbloquea tu primer empleo.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-300 sm:text-lg">
            La plataforma donde los cursos cortos certifican tu capacidad técnica antes de que envíes tu CV.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={scrollToOpportunities}
              className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Ver Vacantes Ahora
            </button>
            <button
              type="button"
              onClick={handleCompanyCTA}
              className="rounded-xl border border-white/15 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400/50 hover:text-white"
            >
              Soy una Empresa
            </button>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">El método Train-to-Hire</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Un flujo simple para que los reclutadores validen habilidades reales y los estudiantes consigan su primera oportunidad.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:border-indigo-400/50"
              >
                <span className="text-2xl" aria-hidden="true">
                  {feature.emoji}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="opportunities" className="mt-16 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Vacantes en vivo</h2>
              <p className="mt-2 text-slate-300">Conectadas en tiempo real con nuestro backend.</p>
            </div>
          </div>

          {actionStatus.message ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                actionStatus.type === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {actionStatus.message}
            </div>
          ) : null}

          {isLoadingOpportunities ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 backdrop-blur-xl">
              Cargando vacantes...
            </div>
          ) : opportunityError ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-200">
              {opportunityError}
            </div>
          ) : visibleOpportunities.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300 backdrop-blur-xl">
              Aún no hay vacantes publicadas. Vuelve pronto.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleOpportunities.map((opportunity) => {
                const courseCompleted = Boolean(opportunity.course_completed);

                return (
                  <article
                    key={opportunity.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-indigo-400/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">{opportunity.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          courseCompleted
                            ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {courseCompleted ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">Empresa: {opportunity.company_name ?? "Empresa Partner"}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{opportunity.description}</p>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleWatchCourse(opportunity)}
                        className="rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-indigo-400/50"
                      >
                        Watch Course
                      </button>
                      <button
                        type="button"
                        disabled={!courseCompleted}
                        onClick={() => handleApply(opportunity.id)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                          courseCompleted
                            ? "bg-indigo-500 hover:bg-indigo-400"
                            : "cursor-not-allowed bg-slate-700 text-slate-300"
                        }`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-3xl border border-indigo-400/20 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Student Panel (MVP)</h2>
          <p className="mt-3 text-slate-300">
            Visualiza tu progreso por vacante y desbloquea la postulación al completar el curso.
          </p>

          {isLoadingOpportunities ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">Cargando panel de estudiante...</div>
          ) : visibleOpportunities.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">No hay vacantes disponibles para mostrar.</div>
          ) : (
            <div className="mt-6 grid gap-4">
              {visibleOpportunities.map((opportunity) => {
                const isUnlocked = Boolean(opportunity.can_apply);
                const progressPercent = Number(opportunity.progress_percent ?? (opportunity.course_completed ? 100 : 0));

                return (
                  <article key={`student-panel-${opportunity.id}`} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{opportunity.title}</h3>
                        <p className="mt-1 text-sm text-slate-300">Empresa: {opportunity.company_name ?? "Empresa Partner"}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isUnlocked
                            ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                            : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {isUnlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                        <span>Progreso del curso</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleWatchCourse(opportunity)}
                        className="rounded-lg border border-white/15 bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-indigo-400/50"
                      >
                        {opportunity.course_content_url ? "Completar Curso" : "Curso pendiente"}
                      </button>
                      <button
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => handleApply(opportunity.id)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                          isUnlocked
                            ? "bg-indigo-500 hover:bg-indigo-400"
                            : "cursor-not-allowed bg-slate-700 text-slate-300"
                        }`}
                      >
                        Apply Now
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/20 to-slate-800/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Sé el primero en saber cuando lancemos nuevas vacantes
          </h2>
          <p className="mt-3 max-w-2xl text-slate-200">
            Únete a la waitlist y recibe oportunidades alineadas a tu perfil apenas estén disponibles.
          </p>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleLeadSubmit}>
            <input
              type="email"
              value={leadEmail}
              onChange={(event) => setLeadEmail(event.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-white/15 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required
            />
            <button
              type="submit"
              disabled={isSubmittingLead}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingLead ? "Guardando..." : "Unirme a la Waitlist"}
            </button>
          </form>

          {leadStatus.message ? (
            <p
              className={`mt-4 text-sm ${
                leadStatus.type === "success" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {leadStatus.message}
            </p>
          ) : null}
        </section>

        <section className="mt-16 rounded-3xl border border-indigo-400/20 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Admin Panel (MVP)</h2>
          <p className="mt-3 text-slate-300">Revisa oportunidades en pending_review, asocia curso y publícalas.</p>

          {adminStatus.message ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                adminStatus.type === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {adminStatus.message}
            </div>
          ) : null}

          {isLoadingPending ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">Cargando pendientes...</div>
          ) : pendingOpportunities.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">No hay oportunidades pendientes por revisar.</div>
          ) : (
            <div className="mt-6 grid gap-4">
              {pendingOpportunities.map((pending) => (
                <article key={pending.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <h3 className="text-lg font-semibold text-white">{pending.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{pending.description}</p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="url"
                      value={courseDraftByOpportunity[pending.id] ?? ""}
                      onChange={(event) => handleCourseDraftChange(pending.id, event.target.value)}
                      placeholder="https://curso.com/modulo-1"
                      className="w-full rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveCourse(pending.id)}
                      className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
                    >
                      Guardar Curso
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublishOpportunity(pending.id)}
                      className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Publicar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Company Panel (MVP)</h2>
          <p className="mt-3 text-slate-300">Publica oportunidades y monitorea su estado: pending_review, published o closed.</p>

          {companyStatus.message ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                companyStatus.type === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-200"
              }`}
            >
              {companyStatus.message}
            </div>
          ) : null}

          <form className="mt-6 grid gap-3" onSubmit={handleCreateCompanyOpportunity}>
            <input
              type="text"
              value={companyForm.title}
              onChange={(event) => handleCompanyFormChange("title", event.target.value)}
              placeholder="Título de la oportunidad"
              className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              required
            />
            <textarea
              value={companyForm.description}
              onChange={(event) => handleCompanyFormChange("description", event.target.value)}
              placeholder="Descripción"
              rows={3}
              className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              required
            />
            <input
              type="text"
              value={companyForm.requirements}
              onChange={(event) => handleCompanyFormChange("requirements", event.target.value)}
              placeholder="Requisitos (opcional)"
              className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
            <div>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Crear Oportunidad
              </button>
            </div>
          </form>

          {isLoadingCompanyOps ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">Cargando oportunidades de empresa...</div>
          ) : companyOpportunities.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-slate-300">Aún no has creado oportunidades.</div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {companyOpportunities.map((companyOpp) => (
                <article key={companyOpp.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <h3 className="font-semibold text-white">{companyOpp.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{companyOpp.description}</p>
                  <span className="mt-3 inline-flex rounded-full border border-white/20 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200">
                    {companyOpp.status}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
