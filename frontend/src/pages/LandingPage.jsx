import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, GraduationCap, Layers3, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const fadeInUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true, amount: 0.35 },
};

const buttonPrimary = "premium-button inline-flex items-center gap-2 bg-brand-500 text-white hover:scale-[1.03] hover:bg-brand-400 hover:shadow-[0_0_32px_rgba(99,102,241,0.45)]";
const buttonSecondary = "premium-button border border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:scale-[1.02] hover:border-brand-400/60";

const bentoCard =
  "group glass-panel relative overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-400/45 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]";

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

          <motion.div
            className="pointer-events-none absolute right-6 top-6 hidden h-28 w-28 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-500/10 lg:flex"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-9 w-9 text-brand-300" />
          </motion.div>

          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
                <Layers3 className="h-4 w-4" />
                Enterprise Hiring OS
              </p>

              <motion.h1 className="mt-6 max-w-4xl text-6xl font-semibold leading-[1.02] tracking-tight sm:text-7xl" {...fadeInUp}>
                <span className="bg-gradient-to-r from-zinc-300 via-zinc-100 to-white bg-clip-text text-transparent">
                  Contrata talento validado
                </span>
                <span className="block bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">con señal real, no ruido.</span>
              </motion.h1>

              <motion.p className="mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg" {...fadeInUp} transition={{ duration: 0.5, delay: 0.08 }}>
                Train-to-Hire convierte formación en métricas accionables para equipos de selección: aprendizaje, validación y postulación en un solo flujo.
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
            </div>

            <motion.div
              className="glass-panel relative rounded-2xl p-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-400">
                <span>Live Insights</span>
                <span className="inline-flex items-center gap-1 text-emerald-300"><Zap className="h-3.5 w-3.5" /> Real-time</span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-xs text-zinc-400">Candidates unlocked</p>
                  <p className="mt-1 text-2xl font-semibold text-white">+72%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-xs text-zinc-400">Time-to-screen</p>
                  <p className="mt-1 text-2xl font-semibold text-white">-41%</p>
                </div>
                <div className="h-2 rounded-full bg-zinc-800">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-brand-400 to-violet-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section className="mt-16" {...fadeInUp}>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Cómo funciona</h2>
          <p className="mt-3 max-w-2xl text-zinc-300">Un bento de capacidades orientado a velocidad, precisión y señal técnica comprobable.</p>
          <div className="mt-8 grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
            <article className={`${bentoCard} md:col-span-2`}>
              <GraduationCap className="h-6 w-6 text-brand-300" />
              <h3 className="mt-3 text-2xl font-semibold">Aprende con contexto real</h3>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">Contenido técnico conectado a vacantes concretas, para reducir desalineación entre currículum y desempeño.</p>
            </article>
            <article className={bentoCard}>
              <Sparkles className="h-6 w-6 text-brand-300" />
              <h3 className="mt-3 text-xl font-semibold">Valida señal</h3>
              <p className="mt-2 text-sm text-zinc-300">Progreso verificable y desbloqueo de candidatura.</p>
            </article>
            <article className={`${bentoCard} md:row-span-2`}>
              <BriefcaseBusiness className="h-6 w-6 text-brand-300" />
              <h3 className="mt-3 text-xl font-semibold">Pipeline premium</h3>
              <p className="mt-2 text-sm text-zinc-300">Empresas priorizan candidatos listos para entrevista técnica.</p>
            </article>
            <article className={`${bentoCard} md:col-span-2`}>
              <Layers3 className="h-6 w-6 text-brand-300" />
              <h3 className="mt-3 text-xl font-semibold">Orquestación end-to-end</h3>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">Dashboards por rol, flujos de publicación y decisiones basadas en datos en una experiencia unificada.</p>
            </article>
          </div>
        </motion.section>

        <motion.section className="glass-panel mt-16 rounded-2xl p-7" {...fadeInUp}>
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
  );
}
