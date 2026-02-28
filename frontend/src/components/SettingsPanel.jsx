import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  Globe,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../lib/ThemeContext";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/* ───── Section Card ───── */
function Section({ title, description, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-5">
        <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/* ───── Field Row ───── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <label className="text-sm font-medium text-zinc-300 shrink-0">{label}</label>
      <div className="sm:max-w-xs sm:w-full">{children}</div>
    </div>
  );
}

/* ───── Toggle Switch ───── */
function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
          enabled ? "bg-emerald-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS PANEL — shared by all dashboards
   ═══════════════════════════════════════════ */
export default function SettingsPanel({ role = "student", profile }) {
  const { theme, setTheme } = useTheme();
  const [settingsTab, setSettingsTab] = useState("account");
  const [language, setLanguage] = useState("es");

  /* Notification prefs (local state — no backend yet) */
  const [notifs, setNotifs] = useState(() => {
    if (role === "company") {
      return { newApplicant: true, weeklyReport: true, opportunityStatus: false, platformUpdates: true };
    }
    return { newOpportunity: true, applicationStatus: true, courseReminder: true, platformUpdates: true };
  });

  const toggleNotif = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const userName =
    profile?.profile_data?.first_name
      ? `${profile.profile_data.first_name} ${profile.profile_data.last_name || ""}`
      : profile?.profile_data?.company_name || profile?.email || "";

  const tabs = [
    { key: "account", label: "Cuenta", icon: User },
    { key: "appearance", label: "Apariencia", icon: Palette },
    { key: "notifications", label: "Notificaciones", icon: Bell },
  ];

  const themeOptions = [
    { value: "light", label: "Modo Claro", icon: Sun, desc: "Interfaz con fondo blanco y colores claros" },
    { value: "dark", label: "Modo Oscuro", icon: Moon, desc: "Interfaz oscura, ideal para uso prolongado" },
    { value: "system", label: "Sincronizar con Sistema", icon: Monitor, desc: "Se adapta automáticamente a tu sistema operativo" },
  ];

  return (
    <motion.div {...fadeUp} className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Ajustes</h2>
        <p className="mt-1 text-sm text-zinc-500">Configura tu cuenta, apariencia y preferencias de notificación.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => {
          const isActive = settingsTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSettingsTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-zinc-600"}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Tab: Account ═══ */}
      {settingsTab === "account" && (
        <motion.div key="account" {...fadeUp} className="space-y-5">
          <Section title="Información de la cuenta" description="Datos básicos asociados a tu cuenta.">
            <Field label="Correo electrónico">
              <input
                readOnly
                value={profile?.email || ""}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 outline-none cursor-default opacity-70"
              />
            </Field>
            <Field label={role === "company" ? "Razón Social" : "Nombre completo"}>
              <input
                readOnly
                value={userName}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-300 outline-none cursor-default opacity-70"
              />
            </Field>
            <Field label="Rol">
              <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                {role === "student" ? "Estudiante" : role === "company" ? "Empresa" : "Administrador"}
              </span>
            </Field>
          </Section>

          <Section title="Seguridad" description="Administra el acceso a tu cuenta.">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-white/[0.04]">
              <div>
                <p className="text-sm font-medium text-zinc-300">Contraseña</p>
                <p className="mt-0.5 text-xs text-zinc-500">Cambia tu contraseña de acceso.</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.06]">
                <KeyRound className="h-3.5 w-3.5" /> Cambiar Contraseña
              </button>
            </div>
          </Section>

          <Section title="Zona de peligro" description="Acciones irreversibles sobre tu cuenta.">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-3">
              <div>
                <p className="text-sm font-medium text-rose-400">Eliminar cuenta</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Esta acción es permanente. Todos tus datos serán eliminados sin posibilidad de recuperación.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20">
                <Trash2 className="h-3.5 w-3.5" /> Eliminar Cuenta
              </button>
            </div>
          </Section>
        </motion.div>
      )}

      {/* ═══ Tab: Appearance ═══ */}
      {settingsTab === "appearance" && (
        <motion.div key="appearance" {...fadeUp} className="space-y-5">
          <Section title="Tema" description="Elige cómo se ve la interfaz de Train-to-Hire.">
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-500/40 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Check badge */}
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      isSelected ? "bg-emerald-500/20" : "bg-white/5"
                    }`}>
                      <Icon className={`h-5 w-5 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? "text-emerald-400" : "text-zinc-300"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-zinc-500">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Idioma" description="Selecciona el idioma de la interfaz.">
            <Field label="Idioma de la plataforma">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </Field>
          </Section>
        </motion.div>
      )}

      {/* ═══ Tab: Notifications ═══ */}
      {settingsTab === "notifications" && (
        <motion.div key="notifications" {...fadeUp} className="space-y-5">
          {role === "student" && (
            <>
              <Section title="Oportunidades" description="Notificaciones sobre nuevas vacantes y contenido.">
                <Toggle
                  enabled={notifs.newOpportunity}
                  onChange={() => toggleNotif("newOpportunity")}
                  label="Nuevas oportunidades"
                  description="Recibe una notificación cuando se publique una nueva oportunidad que coincida con tu perfil."
                />
                <Toggle
                  enabled={notifs.courseReminder}
                  onChange={() => toggleNotif("courseReminder")}
                  label="Recordatorios de cursos"
                  description="Recibe recordatorios para completar cursos pendientes."
                />
              </Section>
              <Section title="Postulaciones" description="Estado y actualizaciones de tus postulaciones.">
                <Toggle
                  enabled={notifs.applicationStatus}
                  onChange={() => toggleNotif("applicationStatus")}
                  label="Estado de postulación"
                  description="Notificarme cuando cambie el estado de alguna de mis postulaciones."
                />
              </Section>
            </>
          )}

          {role === "company" && (
            <>
              <Section title="Talento" description="Notificaciones sobre postulantes y candidatos.">
                <Toggle
                  enabled={notifs.newApplicant}
                  onChange={() => toggleNotif("newApplicant")}
                  label="Nuevos postulantes"
                  description="Recibe una notificación cuando un candidato postule a alguna de tus oportunidades."
                />
                <Toggle
                  enabled={notifs.opportunityStatus}
                  onChange={() => toggleNotif("opportunityStatus")}
                  label="Estado de oportunidades"
                  description="Notificarme cuando una oportunidad cambie de estado (publicada, en revisión, cerrada)."
                />
              </Section>
              <Section title="Reportes" description="Informes periódicos de tu actividad.">
                <Toggle
                  enabled={notifs.weeklyReport}
                  onChange={() => toggleNotif("weeklyReport")}
                  label="Resumen semanal de métricas"
                  description="Recibe un email cada lunes con estadísticas de tus oportunidades y postulantes."
                />
              </Section>
            </>
          )}

          {role === "admin" && (
            <Section title="Sistema" description="Configuración de alertas del sistema.">
              <Toggle
                enabled={notifs.platformUpdates}
                onChange={() => toggleNotif("platformUpdates")}
                label="Actualizaciones de la plataforma"
                description="Recibe alertas sobre nuevas funcionalidades y mantenimiento."
              />
            </Section>
          )}

          <Section title="General">
            <Toggle
              enabled={notifs.platformUpdates}
              onChange={() => toggleNotif("platformUpdates")}
              label="Novedades y actualizaciones"
              description="Recibe información sobre nuevas funciones y mejoras de Train-to-Hire."
            />
          </Section>
        </motion.div>
      )}
    </motion.div>
  );
}
