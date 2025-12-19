import { Stat, Feature, Step, FooterSection, PricingPlan } from "@/types";

export const STATS: Stat[] = [
  { value: "500+", label: "Proyectos Activos" },
  { value: "10k+", label: "Estudiantes" },
  { value: "200+", label: "Empresas" },
];

export const FEATURES: Feature[] = [
  {
    icon: "💼",
    bgColor: "bg-blue-500/10",
    title: "Proyectos Reales",
    description: "Accede a proyectos reales de empresas que necesitan soluciones innovadoras. No más proyectos ficticios.",
  },
  {
    icon: "🎯",
    bgColor: "bg-orange-500/10",
    title: "Matching Inteligente",
    description: "Nuestra IA conecta estudiantes con proyectos según sus habilidades y objetivos de aprendizaje.",
  },
  {
    icon: "📈",
    bgColor: "bg-blue-500/10",
    title: "Experiencia Validada",
    description: "Recibe certificados y referencias verificadas por empresas reales para tu portfolio profesional.",
  },
];

export const STUDENT_STEPS: Step[] = [
  {
    title: "Crea tu Perfil",
    description: "Agrega tus habilidades, intereses y disponibilidad",
  },
  {
    title: "Explora Proyectos",
    description: "Encuentra oportunidades que se ajusten a tus objetivos",
  },
  {
    title: "Postula y Trabaja",
    description: "Colabora en proyectos reales y gana experiencia",
  },
  {
    title: "Obtén Certificación",
    description: "Recibe validación oficial para tu portfolio",
  },
];

export const COMPANY_STEPS: Step[] = [
  {
    title: "Publica tu Proyecto",
    description: "Define requerimientos y habilidades necesarias",
  },
  {
    title: "Recibe Candidatos",
    description: "Nuestra IA te sugiere los mejores perfiles",
  },
  {
    title: "Selecciona y Colabora",
    description: "Trabaja con talento joven y fresco",
  },
  {
    title: "Evalúa Resultados",
    description: "Proporciona feedback y construye tu pipeline de talento",
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Estudiante",
    description: "Para estudiantes que buscan experiencia",
    price: "Gratis",
    features: [
      "Acceso a proyectos ilimitados",
      "Perfil profesional",
      "Certificados verificados",
      "Soporte por email",
    ],
    buttonText: "Comenzar Gratis",
  },
  {
    name: "Empresa Básica",
    description: "Ideal para startups y pequeñas empresas",
    price: "$99",
    features: [
      "Hasta 5 proyectos activos",
      "Matching IA básico",
      "Dashboard de candidatos",
      "Soporte prioritario",
      "Análisis de resultados",
    ],
    buttonText: "Empezar Ahora",
    popular: true,
  },
  {
    name: "Empresa Pro",
    description: "Para empresas con alto volumen",
    price: "$299",
    features: [
      "Proyectos ilimitados",
      "Matching IA avanzado",
      "Gestor de cuenta dedicado",
      "Integraciones API",
      "Reportes personalizados",
      "Capacitación de equipo",
    ],
    buttonText: "Contactar Ventas",
  },
];

export const FOOTER_LINKS: FooterSection[] = [
  {
    title: "Producto",
    links: [
      { label: "Características", href: "#features" },
      { label: "Precios", href: "#pricing" },
      { label: "Casos de Éxito", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nosotros", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "#" },
      { label: "Términos", href: "#" },
      { label: "Contacto", href: "#contact" },
    ],
  },
];
