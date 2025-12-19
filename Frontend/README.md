# SkillBridge Landing Page

Landing page oficial de SkillBridge - La plataforma que conecta estudiantes con proyectos reales de empresas.

## 🚀 Tecnologías

- **Next.js 16** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Turbopack** - Compilación ultrarrápida

## 📁 Estructura (Organizada por Features)

```text
skillbridge-landing/
├── app/
│   └── page.tsx           # Landing page
├── components/
│   ├── landing/           # Componentes de landing ✅
│   │   └── sections/      # Header, Hero, Features, etc
│   ├── auth/              # Autenticación (próximo)
│   └── ui/                # Componentes reutilizables
├── constants/
│   ├── landing.ts         # Datos de landing ✅
│   └── (otros features)
└── types/                 # Tipos TypeScript
```

## 🎨 Diseño

### Paleta de Colores

- **Azul** (Primario): Confianza, profesionalismo
- **Naranja** (Secundario): Energía, acción, oportunidad
- **Dark Mode**: Fondo slate-800/900 para aspecto premium

### Decisiones de Diseño

La combinación Azul + Naranja fue elegida para:

- Equilibrar profesionalismo (empresas) con dinamismo (estudiantes)
- Diferenciarse de la competencia
- Mantener accesibilidad y contraste en dark mode

### Secciones

1. **Hero**: Mensaje principal con estadísticas
2. **Features**: 3 beneficios clave
3. **How It Works**: Proceso para estudiantes y empresas
4. **Pricing**: 3 planes (Estudiante gratis, Empresa Básica, Empresa Pro)
5. **Contact**: Formulario de contacto y datos de comunicación
6. **CTA**: Llamada a la acción
7. **Footer**: Enlaces y contacto

### Navegación

- Beneficios (#features)
- Cómo Funciona (#how-it-works)
- Precios (#pricing)
- Contáctanos (#contact)

## 📁 Estructura del Proyecto

```text
skillbridge-landing/
├── app/                    # App Router de Next.js
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout raíz
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── sections/         # Secciones de la landing
│   │   ├── Header.tsx    # Navegación principal
│   │   ├── Hero.tsx      # Sección hero
│   │   ├── Features.tsx  # Características
│   │   ├── HowItWorks.tsx # Flujo de trabajo
│   │   ├── CTA.tsx       # Call to action
│   │   └── Footer.tsx    # Pie de página
│   └── ui/               # Componentes UI base
├── constants/            # Constantes y datos
│   └── data.ts          # Datos estáticos
├── lib/                 # Utilidades
├── types/               # Tipos TypeScript
└── public/              # Archivos estáticos
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 🌐 Despliegue

La aplicación está lista para ser desplegada en:

- **Vercel** (recomendado)
- **Netlify**
- **Railway**

### Desplegar en Vercel

```bash
npm install -g vercel
vercel
```

## 🎨 Personalización

### Colores

Los colores principales están definidos en `tailwind.config.ts`:

- Azul principal: `blue-600`
- Morado: `purple-600`
- Rosa: `pink-600`

### Contenido

Los textos y datos se encuentran en `constants/data.ts` para facilitar la edición

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
