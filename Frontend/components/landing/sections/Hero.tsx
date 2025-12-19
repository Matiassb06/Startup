import { STATS } from "@/constants/landing";
import { Stat } from "@/types";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-950/50 via-slate-900/50 to-transparent">
      <div className="container mx-auto text-center max-w-5xl">
        <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold animate-fadeIn">
          🚀 Conectando talento con oportunidades reales
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white animate-slideUp delay-100">
          El puente entre{" "}
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent animate-gradientShift">
            estudiantes
          </span>{" "}
          y{" "}
          <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-orange-500 bg-clip-text text-transparent animate-gradientShift">
            empresas
          </span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-slideUp delay-200">
          SkillBridge conecta empresas con proyectos reales y estudiantes que buscan experiencia práctica.
          Desarrolla tu talento, impulsa tu carrera y encuentra soluciones innovadoras.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp delay-300">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-lg font-semibold rounded-xl hover:scale-110 transition-all duration-300 animate-glow hover:shadow-2xl">
            Soy Estudiante
          </button>
          <button className="px-8 py-4 bg-slate-800 border-2 border-slate-600 text-white text-lg font-semibold rounded-xl hover:border-slate-500 hover:scale-105 transition-all duration-300 hover:shadow-xl">
            Soy Empresa
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto animate-slideUp delay-400">
          {STATS.map((stat: Stat, index: number) => (
            <div key={index} className="group cursor-default">
              <div className="text-4xl font-bold text-white group-hover:text-blue-400 group-hover:scale-125 transition-all duration-300 group-hover:animate-pulse">{stat.value}</div>
              <div className="text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
