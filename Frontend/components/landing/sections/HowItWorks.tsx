import { STUDENT_STEPS, COMPANY_STEPS } from "@/constants/landing";
import { Step } from "@/types";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Cómo Funciona</h2>
          <p className="text-xl text-slate-300">Simple, rápido y efectivo</p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* For Students */}
          <div className="animate-slideInLeft">
            <h3 className="text-3xl font-bold mb-8 text-center md:text-left text-white">Para Estudiantes</h3>
            <div className="space-y-6">
              {STUDENT_STEPS.map((step: Step, index: number) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg group-hover:animate-float group-hover:shadow-2xl group-hover:shadow-blue-500/50 group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-white">{step.title}</h4>
                    <p className="text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Companies */}
          <div className="animate-slideInRight">
            <h3 className="text-3xl font-bold mb-8 text-center md:text-left text-white">Para Empresas</h3>
            <div className="space-y-6">
              {COMPANY_STEPS.map((step: Step, index: number) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg group-hover:animate-float group-hover:shadow-2xl group-hover:shadow-orange-500/50 group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1 text-white">{step.title}</h4>
                    <p className="text-slate-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
