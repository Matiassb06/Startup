export default function Header() {
  return (
    <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur-md fixed w-full z-50 shadow-lg animate-slideDown">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg shadow-lg group-hover:animate-spin group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300"></div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
            SkillBridge
          </span>
        </div>
        <div className="hidden md:flex gap-8">
          <a href="#features" className="text-slate-300 hover:text-white hover:scale-110 transition-all duration-300">
            Beneficios
          </a>
          <a href="#how-it-works" className="text-slate-300 hover:text-white hover:scale-110 transition-all duration-300">
            Cómo Funciona
          </a>
          <a href="#pricing" className="text-slate-300 hover:text-white hover:scale-110 transition-all duration-300">
            Precios
          </a>
          <a href="#contact" className="text-slate-300 hover:text-white hover:scale-110 transition-all duration-300">
            Contáctanos
          </a>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-slate-300 hover:text-white hover:scale-105 transition-all duration-300">
            Iniciar Sesión
          </button>
          <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:opacity-90 hover:scale-110 hover:shadow-xl transition-all duration-300 animate-glow">
            Registrarse
          </button>
        </div>
      </nav>
    </header>
  );
}
