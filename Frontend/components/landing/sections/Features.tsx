import { FEATURES } from "@/constants/landing";
import { Feature } from "@/types";

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">¿Por qué SkillBridge?</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            La plataforma que transforma la forma en que estudiantes y empresas colaboran
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {FEATURES.map((feature: Feature, index: number) => (
            <div key={index} className="group p-8 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 animate-scaleIn" style={{animationDelay: `${index * 0.1}s`}}>
              <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:animate-bounce group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors duration-300">{feature.title}</h3>
              <p className="text-slate-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
