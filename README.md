# Train-to-Hire 🚀

Plataforma de reclutamiento donde la capacitación es el filtro.

En lugar de postular solo con CV, los candidatos demuestran habilidades reales mediante cursos y validaciones técnicas asociadas a vacantes concretas.

---

## Visión del producto

**Train-to-Hire** conecta empresas con talento emergente a través de una experiencia basada en evidencia:

1. La empresa publica una necesidad real.
2. Admin revisa, estructura y publica la oportunidad con entrenamiento asociado.
3. El estudiante completa el curso y desbloquea la postulación.

Esto reduce fricción en contratación inicial y mejora la calidad del matching entre demanda y habilidades.

---

## Roadmap por fases

### Fase 1 (actual)
- Conectar empresas y estudiantes con oportunidades reales.
- Validar habilidades con curso + progreso.
- Habilitar postulación solo si el curso está completado.

### Fase 2
- Upskilling interno para empresas.
- Formación personalizada según brechas de competencias en equipos actuales.

### Fase 3
- Expandir el modelo más allá de programación a otras carreras donde el enfoque de evidencia práctica también aplique.

---

## Stack tecnológico

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** FastAPI (Python)
- **ORM:** SQLAlchemy
- **DB:** PostgreSQL
- **Migraciones:** Alembic

---

## Estructura del proyecto

```text
Startup/
├─ backend/
│  ├─ alembic/
│  ├─ database.py
│  ├─ models.py
│  └─ main.py
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ index.css
│  ├─ package.json
│  └─ vite.config.js
├─ train_to_hire_mvp_schema.sql
└─ start-dev.ps1
```

---

## Requisitos

- Python 3.10+
- Node.js 18+
- PostgreSQL local

---

## Configuración rápida (local)

## 1) Backend

```bash
cd backend
```

Crear/activar entorno virtual (si aún no existe):

```bash
python -m venv ..\.venv
..\.venv\Scripts\activate
```

Instalar dependencias:

```bash
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary pydantic alembic
```

Ejecutar migraciones:

```bash
alembic upgrade head
```

Levantar API:

```bash
uvicorn main:app --reload
```

API base:

- http://127.0.0.1:8000

## 2) Frontend

```bash
cd ..\frontend
npm install
npm run dev
```

Frontend:

- http://localhost:5173 (o 5174 si 5173 está ocupado)

## 3) Arranque rápido de ambos servicios (Windows)

Desde la raíz:

```bash
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

---

## Lógica de negocio (MVP)

- **Empresa** crea oportunidad → estado inicial `pending_review`.
- **Admin** revisa, asocia curso y publica (`published`).
- **Estudiante** solo ve oportunidades publicadas.
- **Gatekeeper:** para postular, debe tener curso completado (`is_completed = true`).

---

## Endpoints principales (Fase 1)

### Usuarios
- `POST /users/` → crea o retorna usuario existente (idempotente por email)

### Empresa
- `POST /company/opportunities/` → crear oportunidad (`pending_review`)

### Admin
- `GET /admin/opportunities/pending?admin_id={id}` → listar pendientes
- `PATCH /admin/opportunities/{opportunity_id}/course` → crear/editar curso asociado
- `PATCH /admin/opportunities/{opportunity_id}/publish` → publicar oportunidad

### Estudiante
- `GET /students/{student_id}/opportunities/` → oportunidades publicadas + lock/unlock
- `POST /courses/{course_id}/complete` → marcar curso como completado
- `POST /apply/` → postular (bloquea con 403 si curso no completado)

---

## Estado actual del MVP

✅ Flujo E2E funcional para Fase 1:

- creación de oportunidades por empresa,
- revisión/publicación por admin,
- visualización para estudiante,
- desbloqueo por curso completado,
- postulación con control de duplicados.

---

## Próximos pasos sugeridos

- Panel de empresa (mis oportunidades y estados).
- Métricas base de conversión (unlock rate, apply rate).
- Auth JWT real por rol (actualmente se usan IDs en payload para MVP).
- Pruebas automatizadas mínimas para flujo crítico.

---

## Autor

Proyecto en construcción por **Matias**.

Si te interesa colaborar o dar feedback, abre un issue o PR en este repo.
