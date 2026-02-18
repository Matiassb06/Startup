import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const navLinkClass = "text-sm text-zinc-300 transition hover:text-white";
const buttonGlowClass = "transform rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]";

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          Train-to-Hire
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={navLinkClass}>Inicio</Link>
          <Link to="/metodologia" className={navLinkClass}>Cómo funciona</Link>
          <Link to="/nosotros" className={navLinkClass}>Quiénes somos</Link>
          <Link to="/contacto" className={navLinkClass}>Contacto</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className={`${buttonGlowClass} border border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:border-indigo-400/60`}>
            Iniciar Sesión
          </Link>
          <Link to="/register" className={`${buttonGlowClass} bg-indigo-500 text-white hover:bg-indigo-400`}>
            Registrar
          </Link>
        </div>
      </div>
    </header>
  );
}
