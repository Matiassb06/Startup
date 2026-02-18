import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useState } from "react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNavbar } from "../components/MarketingNavbar";

const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400";
const buttonClass = "inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:scale-[1.03] hover:bg-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_82%_0%,rgba(79,70,229,0.15),transparent_30%)]" />
      <MarketingNavbar />

      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Contáctanos</h1>
          <p className="mt-4 text-zinc-300">¿Eres empresa, universidad o aliado? Conversemos sobre cómo impulsar empleabilidad con tecnología.</p>
        </motion.section>

        <motion.form
          onSubmit={submit}
          className="mt-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Nombre</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Asunto</label>
            <input className={inputClass} value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs uppercase tracking-wider text-zinc-400">Mensaje</label>
            <textarea rows={5} className={inputClass} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required />
          </div>

          <button type="submit" disabled={isSubmitting} className={`${buttonClass} mt-5 disabled:cursor-not-allowed disabled:opacity-70`}>
            <Send className="h-4 w-4" /> {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
          </button>

          {status ? <p className="mt-3 text-sm text-emerald-300">{status}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </motion.form>
      </main>

      <MarketingFooter />
    </div>
  );
}
