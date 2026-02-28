import { AnimatePresence, motion } from "framer-motion";
import { Building2, LogIn, User, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { setSession, getSession } from "../lib/session";

function roleToDashboard(role) {
  if (role === "company") return "/company/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/student/dashboard";
}

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ruc, setRuc] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  const title = useMemo(() => (isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"), [isRegister]);

  // Si el usuario ya está autenticado, redirigir al dashboard
  useEffect(() => {
    const session = getSession();
    if (session?.access_token && session?.role) {
      navigate(roleToDashboard(session.role), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setStatus({ type: "", message: "" });
    if (!isRegister) {
      setSelectedRole(null);
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setRuc("");
    }
  }, [isRegister]);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Ingresa un correo válido." });
      return;
    }
    if (!password.trim()) {
      setStatus({ type: "error", message: "Ingresa una contraseña válida." });
      return;
    }
    if (isRegister && !selectedRole) {
      setStatus({ type: "error", message: "Selecciona primero tu tipo de cuenta." });
      return;
    }
    if (isRegister && selectedRole === "student" && (!firstName.trim() || !lastName.trim())) {
      setStatus({ type: "error", message: "Completa nombre y apellidos para continuar." });
      return;
    }
    if (isRegister && selectedRole === "company" && (!companyName.trim() || !ruc.trim())) {
      setStatus({ type: "error", message: "Completa razón social y RUC para continuar." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      let data;

      if (isRegister) {
        const profileData =
          selectedRole === "student"
            ? { first_name: firstName.trim(), last_name: lastName.trim() }
            : selectedRole === "company"
              ? { company_name: companyName.trim(), ruc: ruc.trim() }
              : {};

        data = await api.post("/auth/register", {
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: selectedRole,
          profile_data: profileData,
        });
      } else {
        data = await api.post("/auth/login", {
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
      }

      // Guardar sesión completa con JWT
      setSession({
        access_token: data.access_token,
        token_type: data.token_type,
        user_id: data.user_id,
        email: data.email,
        role: data.role,
      });

      const target =
        location.state?.from && location.state.from !== "/login"
          ? location.state.from
          : roleToDashboard(data.role);
      navigate(target, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al autenticar.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "peer w-full rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 pb-2.5 pt-6 text-sm text-white outline-none transition focus:border-brand-400/70 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]";
  const labelClass =
    "pointer-events-none absolute left-4 top-4 text-xs uppercase tracking-[0.13em] text-zinc-400 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.13em] peer-focus:text-brand-300";

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-12"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-mesh-slate-violet" />
      <motion.div
        className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl"
        animate={{ opacity: [0.35, 0.62, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-70px] top-[22%] h-[360px] w-[360px] rounded-full bg-violet-500/25 blur-3xl"
        animate={{ opacity: [0.25, 0.52, 0.25], scale: [1, 1.06, 1], y: [0, -12, 0] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[72vh] w-full max-w-lg items-center justify-center sm:min-h-[78vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full rounded-3xl border border-white/10 bg-zinc-900/55 p-5 shadow-2xl backdrop-blur-2xl sm:p-8"
          >
            <h1 className="mb-4 text-2xl font-semibold text-white sm:mb-6 sm:text-3xl">{title}</h1>

            <form className="space-y-3 sm:space-y-4" onSubmit={submit}>
              {isRegister ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                    Paso 1: Selecciona tu tipo de cuenta
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("student")}
                      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 ${
                        selectedRole === "student"
                          ? "border-brand-500/90 bg-brand-500/15"
                          : "border-white/12 bg-white/[0.03] hover:border-brand-400/70 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-400/0 transition duration-300 group-hover:from-brand-500/10 group-hover:to-transparent" />
                      <div className="relative flex items-start gap-3">
                        <div
                          className={`rounded-xl border p-2 ${
                            selectedRole === "student"
                              ? "border-brand-400/60 bg-brand-500/20"
                              : "border-white/15 bg-white/5"
                          }`}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Talento / Estudiante</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Postula, mejora tu perfil y acelera tu empleabilidad.
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole("company")}
                      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-300 ${
                        selectedRole === "company"
                          ? "border-brand-500/90 bg-brand-500/15"
                          : "border-white/12 bg-white/[0.03] hover:border-brand-400/70 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/0 to-brand-500/0 transition duration-300 group-hover:from-violet-500/10 group-hover:to-transparent" />
                      <div className="relative flex items-start gap-3">
                        <div
                          className={`rounded-xl border p-2 ${
                            selectedRole === "company"
                              ? "border-brand-400/60 bg-brand-500/20"
                              : "border-white/15 bg-white/5"
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Empresa / Reclutador</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Publica vacantes y conecta con talento validado.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : null}

              <AnimatePresence initial={false}>
                {(!isRegister || selectedRole) && (
                  <motion.div
                    key={`${isRegister ? selectedRole : "login"}-fields`}
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="space-y-4 overflow-hidden"
                  >
                    {isRegister && selectedRole === "student" ? (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder=" "
                            className={inputClass}
                            required
                          />
                          <label className={labelClass}>Nombre</label>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder=" "
                            className={inputClass}
                            required
                          />
                          <label className={labelClass}>Apellidos</label>
                        </div>
                      </>
                    ) : null}

                    {isRegister && selectedRole === "company" ? (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder=" "
                            className={inputClass}
                            required
                          />
                          <label className={labelClass}>Razón Social</label>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={ruc}
                            onChange={(e) => setRuc(e.target.value)}
                            placeholder=" "
                            className={inputClass}
                            required
                          />
                          <label className={labelClass}>RUC</label>
                        </div>
                      </>
                    ) : null}

                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                        className={inputClass}
                        required
                      />
                      <label className={labelClass}>Correo</label>
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=" "
                        className={inputClass}
                        required
                      />
                      <label className={labelClass}>Contraseña</label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {status.message ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    status.type === "error"
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="premium-button w-full gap-2 bg-brand-500 text-white hover:scale-[1.02] hover:bg-brand-400 hover:shadow-[0_0_28px_rgba(99,102,241,0.4)] disabled:pointer-events-none disabled:opacity-60"
              >
                {isRegister ? (
                  <>
                    <UserPlus className="h-4 w-4" /> {submitting ? "Creando cuenta..." : "Crear cuenta"}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> {submitting ? "Ingresando..." : "Iniciar sesión"}
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-400">
              {isRegister ? (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <Link to="/login" className="font-semibold text-brand-300 hover:underline">
                    Inicia sesión
                  </Link>
                </>
              ) : (
                <>
                  ¿No tienes cuenta?{" "}
                  <Link to="/register" className="font-semibold text-brand-300 hover:underline">
                    Regístrate
                  </Link>
                </>
              )}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
