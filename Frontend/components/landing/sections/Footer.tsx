import { FOOTER_LINKS } from "@/constants/landing";
import { FooterSection, FooterLink } from "@/types";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg"></div>
              <span className="text-xl font-bold text-white">SkillBridge</span>
            </div>
            <p className="text-sm">Conectando talento con oportunidades</p>
          </div>
          {FOOTER_LINKS.map((section: FooterSection, index: number) => (
            <div key={index}>
              <h4 className="text-white font-semibold mb-3">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link: FooterLink, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a href={link.href} className="hover:text-white transition-colors duration-300">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-sm">
          <p>&copy; 2025 SkillBridge. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
