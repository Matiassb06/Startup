export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12 animate-slideUp">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">Contáctanos</h2>
          <p className="text-xl text-slate-300">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 animate-slideUp delay-100">
            <form className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:scale-105 focus:outline-none transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:scale-105 focus:outline-none transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Tipo de usuario</label>
                <select className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300">
                  <option>Soy Estudiante</option>
                  <option>Soy Empresa</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Mensaje</label>
                <textarea
                  rows={4}
                  placeholder="Cuéntanos en qué podemos ayudarte"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:scale-105 focus:outline-none transition-all duration-300 resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-glow"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>

          {/* Información de contacto */}
          <div className="space-y-6 animate-slideUp delay-200">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl group-hover:animate-float inline-block">📧</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Email</h3>
                  <p className="text-slate-300">contacto@skillbridge.com</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl group-hover:animate-float inline-block">💬</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Redes Sociales</h3>
                  <div className="flex gap-3 mt-2">
                    <a href="#" className="text-slate-300 hover:text-blue-400 transition">
                      LinkedIn
                    </a>
                    <span className="text-slate-600">•</span>
                    <a href="#" className="text-slate-300 hover:text-blue-400 transition">
                      Twitter
                    </a>
                    <span className="text-slate-600">•</span>
                    <a href="#" className="text-slate-300 hover:text-blue-400 transition">
                      Instagram
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl group-hover:animate-float inline-block">📍</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Ubicación</h3>
                  <p className="text-slate-300">Lima, Perú</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-orange-500/10 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/50 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 animate-pulse">
              <h3 className="text-white font-bold mb-2">Horario de Atención</h3>
              <p className="text-slate-300">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
              <p className="text-slate-400 text-sm mt-2">
                Respondemos en menos de 24 horas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
