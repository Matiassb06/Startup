import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { path: "/", label: "Inicio", end: true },
  { path: "/metodologia", label: "Cómo funciona" },
  { path: "/nosotros", label: "Quiénes somos" },
  { path: "/contacto", label: "Contacto" },
];

const buttonGlowClass = "premium-button transform hover:scale-[1.03]";

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
          <Link to="/login" className={`${buttonGlowClass} border border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:border-brand-400/60`}>
            Iniciar Sesión
          </Link>
          <Link to="/register" className={`${buttonGlowClass} bg-brand-500 text-white hover:bg-brand-400 hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]`}>
            Registrar
          </Link>
        </div>
      </div>
    </header>
  );
}
