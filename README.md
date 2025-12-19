# SkillBridge - Plataforma Completa

Plataforma que conecta estudiantes con proyectos reales de empresas.

## 📁 Estructura del Proyecto

```text
Startup/
├── Frontend/          # Aplicaciones frontend (Next.js)
│   ├── app/           # App router de Next.js
│   ├── components/    # Componentes organizados por features
│   │   └── landing/   # Componentes de landing page
│   ├── constants/     # Datos y configuraciones
│   └── types/         # TypeScript types
├── Backend/           # API y servicios backend (próximo)
└── Database/          # Esquemas y migraciones (próximo)
```

### Organización por Features

El frontend está organizado por módulos/features para facilitar escalabilidad:

- `landing/` - Página de inicio (actual)
- `auth/` - Autenticación (próximo)
- `dashboard/` - Dashboards (próximo)

## 🚀 Stack Tecnológico

### Frontend

- Next.js 16 + TypeScript
- Tailwind CSS v4
- Animaciones CSS personalizadas
- Diseño dark mode responsive

### Backend (Próximo)

- NestJS + TypeScript
- PostgreSQL + Prisma
- JWT Authentication
- Python + FastAPI (IA)

### Database (Próximo)

- PostgreSQL
- Redis (cache)

## 🎯 Roadmap

### Fase 1: MVP (Actual)

- [x] Landing page
  - [x] Diseño dark mode
  - [x] Paleta de colores (Azul + Naranja)
  - [x] Responsive design
  - [x] Secciones completas (Hero, Features, How It Works, Pricing, Contact)
  - [x] Animaciones personalizadas
  - [x] Planes de precios
  - [x] Formulario de contacto
  - [x] Optimización de código
- [ ] Autenticación
- [ ] Dashboard estudiantes
- [ ] Dashboard empresas
- [ ] Sistema de proyectos
- [ ] Sistema de postulaciones

### Fase 2: Matching IA

- [ ] Algoritmo de matching
- [ ] Recomendaciones personalizadas
- [ ] Análisis de habilidades

### Fase 3: Escalamiento

- [ ] Sistema de pagos
- [ ] Certificaciones
- [ ] LMS (Learning Management System)
- [ ] Upskilling empresas

## 🛠️ Desarrollo

Consulta el README de cada carpeta para instrucciones específicas.
