# Backend - SkillBridge

API backend de SkillBridge.

## 🛠️ Stack Tecnológico Planeado

- **Framework:** NestJS + TypeScript
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT + NextAuth
- **IA/ML:** Microservicio Python + FastAPI
- **Cache:** Redis (opcional)

## 📁 Estructura Futura

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── applications/
│   │   └── companies/
│   ├── common/
│   ├── config/
│   └── main.ts
├── prisma/
│   └── schema.prisma
└── test/
```

## 🚀 Próximo paso

Crear API REST con NestJS para:

- Gestión de usuarios (estudiantes/empresas)
- CRUD de proyectos
- Sistema de postulaciones
- Matching IA
