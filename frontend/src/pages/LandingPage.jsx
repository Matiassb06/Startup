import { motion } from "framer-motion";
import { ArrowRight, BookMarked, BrainCircuit, Building2, Cpu, Globe, Layers3, Network, Rocket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const fadeInUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.35 },
};

const buttonPrimary =
  "premium-button inline-flex items-center gap-2 bg-brand-500 text-white hover:scale-[1.03] hover:bg-brand-400 hover:shadow-[0_0_32px_rgba(99,102,241,0.45)]";
const buttonSecondary =
  "premium-button inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:scale-[1.02] hover:border-brand-400/60";

const bentoCard =
  "glass-panel group relative overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-400/50 hover:shadow-[0_0_42px_rgba(99,102,241,0.25)]";

const logos = [Building2, Cpu, Globe, Network, BrainCircuit, Rocket];

export function LandingPage() {
  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <motion.section
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-2xl sm:p-12"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="pointer-events-none absolute -left-24 top-[-40%] h-[480px] w-[480px] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
            <Sparkles className="h-4 w-4" />
            New Feature · AI Signal Ranking
          </p>

          <motion.h1 className="mt-6 max-w-5xl text-6xl font-semibold leading-[1.02] tracking-tight sm:text-7xl" {...fadeInUp}>
            <span className="bg-gradient-to-r from-zinc-300 via-zinc-100 to-white bg-clip-text text-transparent">
              Enterprise hiring for
            </span>
            <span className="block bg-gradient-to-r from-zinc-100 via-zinc-300 to-white bg-clip-text text-transparent">
              the next generation.
            </span>
          </motion.h1>

          <motion.p className="mt-6 max-w-3xl text-base text-zinc-300 sm:text-lg" {...fadeInUp} transition={{ duration: 0.5, delay: 0.08 }}>
            Train-to-Hire unifica matching inteligente, validación técnica y analítica de desempeño en una sola experiencia de talento.
          </motion.p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={buttonPrimary}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/metodologia" className={buttonSecondary}>
              <Layers3 className="h-4 w-4" />
              View Demo
            </Link>
          </div>
        </div>
      </motion.section>

      <motion.section className="mt-12" {...fadeInUp}>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Trusted by future leaders from:</p>
        <div className="mt-5 grid grid-cols-3 gap-4 text-zinc-300 sm:grid-cols-6">
          {logos.map((Icon, index) => (
            <div key={index} className="glass-panel flex items-center justify-center rounded-xl py-4 opacity-50 transition hover:opacity-80">
              <Icon className="h-6 w-6" />
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section className="mt-14" {...fadeInUp}>
        <div className="grid auto-rows-[minmax(170px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
          <article className={`${bentoCard} md:col-span-2`}>
            <BrainCircuit className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 text-2xl font-semibold">AI-Powered Matching</h3>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              Prioriza candidatos por evidencia de habilidades, progreso técnico y afinidad con cada oportunidad en tiempo real.
            </p>
          </article>
          <article className={bentoCard}>
            <Layers3 className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 text-xl font-semibold">Real-time Analytics</h3>
            <p className="mt-2 text-sm text-zinc-300">Monitorea conversión, desbloqueos y performance del funnel de talento.</p>
          </article>
          <article className={bentoCard}>
            <Globe className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 text-xl font-semibold">Global Reach</h3>
            <p className="mt-2 text-sm text-zinc-300">Conecta empresas y talento emergente en múltiples regiones.</p>
          </article>
          <article className={bentoCard}>
            <BookMarked className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 text-xl font-semibold">Guided Learning</h3>
            <p className="mt-2 text-sm text-zinc-300">Rutas formativas alineadas a puestos reales y skill gaps detectados.</p>
          </article>
          <article className={bentoCard}>
            <Building2 className="h-6 w-6 text-brand-300" />
            <h3 className="mt-3 text-xl font-semibold">Enterprise Ready</h3>
            <p className="mt-2 text-sm text-zinc-300">Arquitectura modular para operación con equipos de recruiting y RRHH.</p>
          </article>
        </div>
      </motion.section>

      <motion.section className="mt-14 grid gap-4 sm:grid-cols-3" {...fadeInUp}>
        {[
          { label: "Candidates", value: "500+" },
          { label: "Companies", value: "120+" },
          { label: "Success Rate", value: "98%" },
        ].map((stat) => (
          <article key={stat.label} className="glass-panel rounded-2xl p-6 text-center">
            <p className="text-4xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.14em] text-zinc-400">{stat.label}</p>
          </article>
        ))}
      </motion.section>

      <motion.section className="glass-panel mt-14 rounded-3xl p-8 text-center sm:p-10" {...fadeInUp}>
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to transform your future?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
          Da el siguiente paso con una plataforma de empleabilidad diseñada para velocidad, transparencia y resultados medibles.
        </p>
        <Link to="/contacto" className={`${buttonPrimary} mt-6`}>
          Hablar con el equipo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.section>
    </main>
  );
}
