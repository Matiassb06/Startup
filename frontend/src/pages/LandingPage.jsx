import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, GraduationCap, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNavbar } from "../components/MarketingNavbar";

const fadeInUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.35 },
};

const buttonPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.03] hover:bg-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]";
const buttonSecondary =
  "rounded-lg border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 transition duration-200 hover:scale-[1.02] hover:border-indigo-400/50";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(79,70,229,0.18),transparent_30%)]" />
      <MarketingNavbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.section
          className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl sm:p-12"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            className="pointer-events-none absolute right-6 top-6 hidden h-28 w-28 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 lg:flex"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-9 w-9 text-indigo-300" />
          </motion.div>

          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <Layers3 className="h-4 w-4" />
            Plataforma High-Tech
          </p>

          <motion.h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl" {...fadeInUp}>
            Desbloquea talento con tecnología, evidencia y oportunidades reales.
          </motion.h1>

          <motion.p className="mt-5 max-w-3xl text-base text-zinc-300 sm:text-lg" {...fadeInUp} transition={{ duration: 0.5, delay: 0.08 }}>
            Train-to-Hire conecta empresas y estudiantes con un sistema de validación práctica: aprende, demuestra, y postula con ventaja competitiva.
          </motion.p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/metodologia" className={buttonPrimary}>
              Explorar Plataforma
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/nosotros" className={buttonSecondary}>
              Conocer más
            </Link>
          </div>
        </motion.section>

        <motion.section className="mt-16" {...fadeInUp}>
          <h2 className="text-3xl font-bold text-white">Cómo funciona</h2>
          <p className="mt-3 max-w-2xl text-zinc-300">Una metodología simple y efectiva para conectar talento con necesidades reales del mercado.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
              <GraduationCap className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Aprende</h3>
              <p className="mt-2 text-sm text-zinc-300">Contenido técnico alineado a vacantes concretas publicadas por empresas.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
              <Sparkles className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Valida</h3>
              <p className="mt-2 text-sm text-zinc-300">Tu progreso desbloquea la postulación y demuestra preparación real.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
              <BriefcaseBusiness className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Postula</h3>
              <p className="mt-2 text-sm text-zinc-300">Aplica a oportunidades con filtro técnico y mejor tasa de matching.</p>
            </article>
          </div>
        </motion.section>

        <motion.section className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-lg" {...fadeInUp}>
          <h2 className="text-2xl font-bold text-white">Explora más</h2>
          <p className="mt-3 max-w-3xl text-zinc-300">
            Conoce nuestra metodología, la historia detrás de Train-to-Hire y cómo puedes colaborar como empresa, institución o aliado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/metodologia" className={buttonSecondary}>Ver metodología</Link>
            <Link to="/nosotros" className={buttonSecondary}>Quiénes somos</Link>
            <Link to="/contacto" className={buttonPrimary}>Contactar equipo</Link>
          </div>
        </motion.section>
      </main>

      <MarketingFooter />
    </div>
  );
}
