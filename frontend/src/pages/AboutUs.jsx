import { motion } from "framer-motion";
import { Lightbulb, Target } from "lucide-react";

import { MarketingFooter } from "../components/MarketingFooter";
import { MarketingNavbar } from "../components/MarketingNavbar";

const cardClass = "rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-7";

export function AboutUs() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(79,70,229,0.15),transparent_30%)]" />
      <MarketingNavbar />

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Quiénes Somos</h1>
          <p className="mt-4 max-w-3xl text-zinc-300">
            Train-to-Hire nace de la visión de un fundador de 19 años que quiere transformar la relación entre educación y empleo en LATAM.
          </p>
        </motion.section>

        <motion.section
          className="mt-10 grid gap-5 lg:grid-cols-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <article className={cardClass}>
            <Target className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-3 text-2xl font-semibold">Misión</h2>
            <p className="mt-3 text-zinc-300">
              Democratizar el acceso al primer empleo profesional conectando talento joven con oportunidades reales y validación técnica transparente.
            </p>
          </article>
          <article className={cardClass}>
            <Lightbulb className="h-6 w-6 text-indigo-300" />
            <h2 className="mt-3 text-2xl font-semibold">Visión</h2>
            <p className="mt-3 text-zinc-300">
              Construir la plataforma líder de empleabilidad basada en evidencia, donde aprender y demostrar valor tenga más peso que el CV tradicional.
            </p>
          </article>
        </motion.section>
      </main>

      <MarketingFooter />
    </div>
  );
}
