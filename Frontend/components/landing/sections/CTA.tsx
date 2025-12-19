export default function CTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-3xl p-12 text-center text-white shadow-2xl animate-scaleIn hover:scale-105 transition-transform duration-300 animate-gradientShift">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-pulse">¿Listo para empezar?</h2>
          <p className="text-xl mb-8 opacity-90 animate-fadeIn">
            Únete a miles de estudiantes y empresas que ya están colaborando en SkillBridge
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp">
            <button className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-100 hover:scale-110 hover:shadow-2xl transition-all duration-300">
              Registrarme Gratis
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white/10 hover:scale-110 hover:shadow-2xl transition-all duration-300">
              Ver Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
