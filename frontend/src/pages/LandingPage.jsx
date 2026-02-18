import { ArrowRight, BriefcaseBusiness, Building2, GraduationCap, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(79,70,229,0.18),transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Train-to-Hire
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href="#como-funciona" className="hover:text-white">Cómo funciona</a>
            <a href="#quienes-somos" className="hover:text-white">Quiénes somos</a>
            <a href="#contacto" className="hover:text-white">Contacto</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-100 hover:border-indigo-400/50"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Registrar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section id="inicio" className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <Layers3 className="h-4 w-4" />
            Plataforma High-Tech
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Desbloquea talento con tecnología, evidencia y oportunidades reales.
          </h1>
          <p className="mt-5 max-w-3xl text-base text-zinc-300 sm:text-lg">
            Train-to-Hire conecta empresas y estudiantes con un sistema de validación práctica: aprende, demuestra, y postula con ventaja competitiva.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Explorar Plataforma
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/register"
              className="rounded-lg border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 hover:border-indigo-400/50"
            >
              Crear Cuenta
            </Link>
          </div>
        </section>

        <section id="como-funciona" className="mt-16">
          <h2 className="text-3xl font-bold text-white">Cómo funciona</h2>
          <p className="mt-3 max-w-2xl text-zinc-300">Una metodología simple y efectiva para conectar talento con necesidades reales del mercado.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
              <GraduationCap className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Aprende</h3>
              <p className="mt-2 text-sm text-zinc-300">Contenido técnico alineado a vacantes concretas publicadas por empresas.</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
              <Sparkles className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Valida</h3>
              <p className="mt-2 text-sm text-zinc-300">Tu progreso desbloquea la postulación y demuestra preparación real.</p>
            </article>
            <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-xl">
              <BriefcaseBusiness className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-3 text-xl font-semibold">Postula</h3>
              <p className="mt-2 text-sm text-zinc-300">Aplica a oportunidades con filtro técnico y mejor tasa de matching.</p>
            </article>
          </div>
        </section>

        <section id="quienes-somos" className="mt-16 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Quiénes Somos</h2>
            <p className="mt-3 text-zinc-300">
              Somos una startup enfocada en cerrar la brecha entre formación y empleabilidad, usando tecnología para validar habilidades antes del CV.
            </p>
            <p className="mt-3 text-zinc-400">
              Nuestra misión: acelerar el acceso al primer empleo y optimizar la búsqueda de talento para empresas.
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white">Servicios</h2>
            <ul className="mt-4 space-y-3 text-zinc-300">
              <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-300" /> Reclutamiento con filtro de capacitación.</li>
              <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-300" /> Retos técnicos y micro-experiencias laborales.</li>
              <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-300" /> Paneles por rol: estudiante, empresa y admin.</li>
            </ul>
          </article>
        </section>
      </main>

      <footer id="contacto" className="relative mt-16 border-t border-zinc-800/80 bg-zinc-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:px-8">
          <p className="text-zinc-200">Contáctanos</p>
          <p>hello@traintohire.dev</p>
          <p>© {new Date().getFullYear()} Train-to-Hire. Plataforma de talento validado.</p>
        </div>
      </footer>
    </div>
  );
}
