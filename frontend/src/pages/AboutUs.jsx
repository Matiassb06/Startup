import { motion } from "framer-motion";
import { Gauge, Lightbulb, ShieldCheck, Sparkles, Target } from "lucide-react";

const values = [
  {
    title: "Transparency",
    description: "Procesos y resultados visibles para candidatos y empresas en cada etapa.",
    Icon: ShieldCheck,
  },
  {
    title: "Excellence",
    description: "Estandares de calidad técnica orientados a contratación real.",
    Icon: Target,
  },
  {
    title: "Innovation",
    description: "Diseñamos experiencias de empleabilidad impulsadas por datos.",
    Icon: Lightbulb,
  },
  {
    title: "Speed",
    description: "Reducimos fricción del funnel para acelerar decisiones de talento.",
    Icon: Gauge,
  },
];

export function AboutUs() {
  return (
    <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.section
        className="glass-panel rounded-3xl p-8 text-center sm:p-12"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Mission Statement</p>
        <blockquote className="mx-auto mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
          “Estamos construyendo el puente entre aprendizaje y empleabilidad para que el talento joven pueda demostrar valor real desde el día uno.”
        </blockquote>
      </motion.section>

      <motion.section
        className="mt-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="text-3xl font-semibold text-white">Our Core Values</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <article key={value.title} className="glass-panel rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-400/45">
              <value.Icon className="h-5 w-5 text-brand-300" />
              <h3 className="mt-3 text-lg font-semibold text-white">{value.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{value.description}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="glass-panel mt-12 rounded-3xl p-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 className="text-3xl font-semibold text-white">Meet the Visionaries</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="flex h-52 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/70">
            <Sparkles className="h-10 w-10 text-brand-300" />
          </div>
          <article className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Founder</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">Matías · CEO & Product Builder</h3>
            <p className="mt-3 text-zinc-300">
              Con una visión joven y foco en ejecución, lidera Train-to-Hire para redefinir cómo las empresas descubren talento y cómo los estudiantes acceden a oportunidades reales.
            </p>
          </article>
        </div>
      </motion.section>
    </main>
  );
}
