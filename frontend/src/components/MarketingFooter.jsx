import { Link } from "react-router-dom";

export function MarketingFooter() {
  return (
    <footer className="relative mt-16 border-t border-zinc-800/80 bg-zinc-950/90">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="font-medium text-zinc-100">Contáctanos</p>
          <p className="mt-1">hello@traintohire.dev</p>
          <p className="mt-2">© {new Date().getFullYear()} Train-to-Hire.</p>
        </div>
        <div className="flex gap-6 lg:justify-end">
          <Link to="/metodologia" className="hover:text-white">Metodología</Link>
          <Link to="/nosotros" className="hover:text-white">Nosotros</Link>
          <Link to="/contacto" className="hover:text-white">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}
