import { PRICING_PLANS } from "@/constants/landing";
import { PricingPlan } from "@/types";

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Planes y Precios</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Elige el plan perfecto para tus necesidades
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan: PricingPlan, index: number) => (
            <div
              key={index}
              className={`p-8 rounded-2xl border ${
                plan.popular
                  ? "border-blue-500 bg-slate-800 shadow-xl shadow-blue-500/20 scale-105"
                  : "border-slate-700 bg-slate-800/50"
              } hover:border-slate-600 hover:scale-105 transition-all duration-300 animate-scaleIn`}
              style={{animationDelay: `${index * 0.15}s`}}
            >
              {plan.popular && (
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-orange-500 text-white text-xs font-bold rounded-full mb-4">
                  MÁS POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
              <p className="text-slate-300 mb-6">{plan.description}</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">{plan.price}</span>
                {plan.price !== "Gratis" && <span className="text-slate-400">/mes</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 group/item">
                    <span className="text-blue-400 mt-1 group-hover/item:animate-bounce inline-block">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-500 to-orange-500 text-white hover:opacity-90 hover:shadow-2xl animate-glow"
                    : "bg-slate-700 text-white hover:bg-slate-600 hover:shadow-xl"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
