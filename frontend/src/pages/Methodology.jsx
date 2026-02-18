import { motion } from "framer-motion";
import { BrainCircuit, Rocket, ScanLine } from "lucide-react";

const steps = [
  {
    title: "Skill Gap Analysis",
    description: "Detectamos brechas técnicas entre talento disponible y requisitos reales de las vacantes activas.",
    Icon: ScanLine,
  },
  {
    title: "Tailored Training",
    description: "Activamos rutas de aprendizaje específicas para acelerar preparación y validación de habilidades clave.",
    Icon: BrainCircuit,
  },
  {
    title: "Direct Hiring",
    description: "Desbloqueamos candidatos listos para entrevista, reduciendo tiempo de screening y riesgo de desajuste.",
    Icon: Rocket,
  },
];

export function Methodology() {
  return (
    <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Methodology Engine</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Un proceso interactivo en tres etapas para transformar potencial en talento empleable con métricas claras.
        </p>
      </motion.section>

      <section className="relative mt-12">
        <div className="pointer-events-none absolute left-[31px] top-3 h-[calc(100%-24px)] w-px bg-gradient-to-b from-brand-400 via-violet-400 to-transparent" />

        <div className="space-y-6">
          {steps.map((step, index) => {
            const fromLeft = index % 2 === 0;
            return (
              <motion.article
                key={step.title}
                className="glass-panel relative ml-16 rounded-2xl p-6"
                initial={{ opacity: 0, x: fromLeft ? -28 : 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.4 }}
              >
                <span className="absolute -left-[50px] top-6 flex h-9 w-9 items-center justify-center rounded-full border border-brand-400/40 bg-brand-500/15 text-brand-300">
                  <step.Icon className="h-4.5 w-4.5" />
                </span>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Step {index + 1}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-zinc-300">{step.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
