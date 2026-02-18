import { motion } from "framer-motion";
import { Mail, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

const fieldClass =
  "peer w-full rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 pb-2.5 pt-6 text-sm text-white outline-none transition focus:border-brand-400/70 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]";
const labelClass =
  "pointer-events-none absolute left-4 top-4 text-xs uppercase tracking-[0.13em] text-zinc-400 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.13em] peer-focus:text-brand-300";
const buttonClass = "premium-button inline-flex items-center gap-2 bg-brand-500 text-white hover:scale-[1.03] hover:bg-brand-400 hover:shadow-[0_0_32px_rgba(99,102,241,0.4)]";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = detail?.detail || "No se pudo enviar tu mensaje. Intenta nuevamente.";
        throw new Error(typeof message === "string" ? message : "No se pudo enviar tu mensaje. Intenta nuevamente.");
      }

      const data = await response.json();
      setStatus(data?.message || "Gracias por escribirnos. Te responderemos pronto.");
      alert(data?.message || "Mensaje enviado correctamente.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Ocurrió un error inesperado.";
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
              <Sparkles className="h-4 w-4" /> Get in touch
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight text-white sm:text-6xl">
              Hablemos de tu
              <span className="block bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">próximo equipo.</span>
            </h1>
            <p className="mt-5 max-w-xl text-zinc-300">
              Si eres empresa, institución o aliado, diseñamos un flujo de contratación orientado a evidencia técnica y velocidad operativa.
            </p>

            <div className="mt-8 space-y-3">
              <div className="glass-panel flex items-center gap-3 rounded-xl p-4">
                <Mail className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">Correo</p>
                  <p className="text-sm text-zinc-100">hello@traintohire.dev</p>
                </div>
              </div>
              <div className="glass-panel flex items-center gap-3 rounded-xl p-4">
                <ShieldCheck className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">Respuesta</p>
                  <p className="text-sm text-zinc-100">SLA promedio: 24 horas hábiles</p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.form
            onSubmit={submit}
            className="glass-panel rounded-2xl p-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <input
                  placeholder=" "
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <label className={labelClass}>Nombre</label>
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder=" "
                  className={fieldClass}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <label className={labelClass}>Email</label>
              </div>
            </div>

            <div className="relative mt-4">
              <input
                placeholder=" "
                className={fieldClass}
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                required
              />
              <label className={labelClass}>Asunto</label>
            </div>

            <div className="relative mt-4">
              <textarea
                rows={6}
                placeholder=" "
                className={fieldClass}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                required
              />
              <label className={labelClass}>Mensaje</label>
            </div>

            <button type="submit" disabled={isSubmitting} className={`${buttonClass} mt-5 disabled:cursor-not-allowed disabled:opacity-70`}>
              <Send className="h-4 w-4" /> {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
            </button>

            {status ? <p className="mt-3 text-sm text-emerald-300">{status}</p> : null}
            {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
          </motion.form>
        </div>
      </main>
  );
}
