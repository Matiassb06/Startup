import { motion } from "framer-motion";
import { ChevronRight, LogIn, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Inicio", end: true },
  { path: "/metodologia", label: "Cómo funciona" },
  { path: "/nosotros", label: "Quiénes somos" },
  { path: "/contacto", label: "Contacto" },
];

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-brand-400" />
          Train-to-Hire
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-full px-4 py-2 text-sm transition ${isActive ? "text-white" : "text-zinc-300 hover:text-white"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: "spring", stiffness: 420, damping: 35 }}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 backdrop-blur-md transition duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <LogIn className="h-4 w-4 text-zinc-300 transition group-hover:text-white" />
            <span>Iniciar Sesión</span>
          </Link>

          <Link
            to="/register"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:scale-[1.03] hover:bg-brand-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.45)]"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[130%]" />
            <span className="relative z-10">Registrar</span>
            <ChevronRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </header>
  );
}
