import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Rocket } from "lucide-react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNavbar } from "../components/MarketingNavbar";

const cardClass = "rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6";

export function Methodology() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(79,70,229,0.16),transparent_30%)]" />
      <MarketingNavbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Cómo Funciona Train-to-Hire</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">Una metodología diseñada para validar habilidades reales antes de la postulación.</p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          <article className={cardClass}>
            <BookOpen className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-3 text-xl font-semibold">1. Aprende</h2>
            <p className="mt-2 text-sm text-zinc-300">La empresa define una necesidad y se asocia capacitación puntual para ese reto.</p>
          </article>
          <article className={cardClass}>
            <CheckCircle2 className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-3 text-xl font-semibold">2. Valida</h2>
            <p className="mt-2 text-sm text-zinc-300">El estudiante demuestra progreso técnico real y desbloquea su postulación.</p>
          </article>
          <article className={cardClass}>
            <Rocket className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-3 text-xl font-semibold">3. Postula</h2>
            <p className="mt-2 text-sm text-zinc-300">Solo candidatos validados pasan al siguiente paso, aumentando calidad de matching.</p>
          </article>
        </motion.section>
      </main>

      <MarketingFooter />
    </div>
  );
}
