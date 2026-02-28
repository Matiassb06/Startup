"""
Train-to-Hire API — main.py
FastAPI backend con JWT auth, sistema de roles y flujo core de reclutamiento.
"""

import math
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware

import models
import database
import auth
import email_service
import logging_config
import ai_service

import logging
import time
from starlette.requests import Request
from starlette.responses import Response

# ── Inicializar logging estructurado ──
logging_config.setup_logging()
logger = logging.getLogger("traintohire.api")

app = FastAPI(title="Train-To-Hire API", version="2.0.0")


# ── Middleware de logging de requests ──
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)

    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response

# ── CORS ───────────────────────────────────────────────────────────
_cors_raw = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
# SCHEMAS (Pydantic)
# ══════════════════════════════════════════════════════════════════

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# ── Auth ──
class RegisterIn(StrictModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=4, max_length=128)
    role: models.UserRole
    profile_data: dict = Field(default_factory=dict)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        normalized = v.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("email inválido")
        return normalized


class LoginIn(StrictModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class AuthOut(StrictModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class UserProfileOut(StrictModel):
    id: int
    email: str
    role: str
    profile_data: dict


class UserProfileUpdateIn(StrictModel):
    profile_data: dict


# ── Opportunity ──
class OpportunityOut(StrictModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    status: models.OpportunityStatus


class OpportunityCreateIn(StrictModel):
    title: str = Field(min_length=4, max_length=180)
    description: str = Field(min_length=10, max_length=3000)
    requirements: Optional[str] = Field(default=None, max_length=2000)


class StudentOpportunityOut(StrictModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    company_name: str
    status: models.OpportunityStatus
    course_id: Optional[int] = None
    course_name: Optional[str] = None
    course_modules: list = Field(default_factory=list)
    progress_percent: int
    course_completed: bool
    can_apply: bool
    already_applied: bool = False


# ── Course / Module / Topic schemas ──

class TopicIn(StrictModel):
    """Tema dentro de un módulo."""
    title: str = Field(min_length=1, max_length=255)
    content_url: str | None = None
    order: int = 0

    @field_validator("content_url", mode="before")
    @classmethod
    def clean_content_url(cls, value) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None


class ModuleIn(StrictModel):
    """Módulo dentro de un curso."""
    title: str = Field(min_length=1, max_length=255)
    order: int = 0
    topics: list[TopicIn] = Field(default_factory=list)


class TopicOut(StrictModel):
    id: int
    title: str
    content_url: str | None = None
    order: int


class ModuleOut(StrictModel):
    id: int
    title: str
    order: int
    topics: list[TopicOut] = Field(default_factory=list)


class PublishWithCourseIn(StrictModel):
    """Al publicar se selecciona un curso del catálogo."""
    catalog_course_id: int


class CatalogCourseCreateIn(StrictModel):
    """Crear un curso con módulos y temas anidados."""
    name: str = Field(min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    modules: list[ModuleIn] = Field(default_factory=list)


class CatalogCourseUpdateIn(StrictModel):
    """Editar un curso del catálogo (reemplaza módulos/temas completos)."""
    name: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    modules: Optional[list[ModuleIn]] = None


class CatalogCourseOut(StrictModel):
    id: int
    name: str
    description: Optional[str] = None
    modules: list[ModuleOut] = Field(default_factory=list)
    is_active: bool


class CatalogCourseListOut(StrictModel):
    """Versión resumida para listados (sin temas anidados)."""
    id: int
    name: str
    description: Optional[str] = None
    module_count: int = 0
    topic_count: int = 0
    is_active: bool


class CourseOut(StrictModel):
    id: int
    opportunity_id: Optional[int] = None
    name: str
    quiz_data: dict
    modules: list[ModuleOut] = Field(default_factory=list)


class CourseCompletionIn(StrictModel):
    score: Optional[int] = Field(default=None, ge=0, le=100)


class CourseCompletionOut(StrictModel):
    user_id: int
    course_id: int
    is_completed: bool
    score: Optional[int] = None


# ── Apply ──
class ApplyIn(StrictModel):
    opportunity_id: int


# ── AI schemas ──
class AIGenerateCourseIn(StrictModel):
    """Datos para generar un curso con IA."""
    name: str = Field(min_length=3, max_length=255)
    description: str = Field(default="", max_length=2000)
    requirements: str = Field(default="", max_length=2000)
    num_modules: int = Field(default=3, ge=1, le=10)
    topics_per_module: int = Field(default=3, ge=1, le=10)


class AITutorIn(StrictModel):
    """Pregunta al tutor IA."""
    question: str = Field(min_length=2, max_length=1000)
    conversation_history: list[dict] = Field(default_factory=list)


class AITutorOut(StrictModel):
    answer: str
    course_name: str


class AIScoreIn(StrictModel):
    """Solicitar scoring IA para un aplicante."""
    application_id: int


class AIScoreOut(StrictModel):
    score: int
    summary: str
    strengths: list[str]
    areas_to_improve: list[str]
    recommendation: str


# ── Metrics ──
class MetricsSummaryOut(StrictModel):
    window_days: int
    total_users: int
    total_students: int
    total_companies: int
    opportunities_created: int
    opportunities_published: int
    pending_opportunities: int
    published_opportunities: int
    course_completions: int
    apply_attempts: int
    apply_success: int
    apply_blocked: int
    unlock_rate_percent: float
    apply_success_rate_percent: float


# ── Contact ──
class ContactMessageIn(StrictModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    subject: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("email inválido")
        return normalized


class ContactMessageOut(StrictModel):
    message: str


# ── Company Applicant ──
class ApplicantOut(StrictModel):
    application_id: int
    user_id: int
    email: str
    profile_data: dict
    applied_at: str
    course_completed: bool
    course_score: Optional[int] = None


class AdminUserOut(StrictModel):
    id: int
    email: str
    role: str
    profile_data: dict


class StudentApplicationOut(StrictModel):
    application_id: int
    opportunity_id: int
    opportunity_title: str
    company_name: str
    applied_at: str


# ── Paginación genérica ──
class PaginationParams:
    """Parámetros de paginación reutilizables como dependency."""
    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Número de página (1-indexed)"),
        page_size: int = Query(default=20, ge=1, le=100, description="Elementos por página"),
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size

class PaginatedOut(BaseModel):
    """Wrapper genérico para respuestas paginadas."""
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


# ══════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════

def _log_event(
    db: Session,
    event_type: str,
    *,
    user_id: Optional[int] = None,
    opportunity_id: Optional[int] = None,
    course_id: Optional[int] = None,
    payload: Optional[dict] = None,
) -> None:
    db.add(
        models.AnalyticsEvent(
            event_type=event_type,
            user_id=user_id,
            opportunity_id=opportunity_id,
            course_id=course_id,
            payload=payload or {},
        )
    )


def _company_display_name(user: models.User) -> str:
    pd = user.profile_data or {}
    if pd.get("company_name"):
        return pd["company_name"]
    if user.email:
        return user.email.split("@")[0].replace(".", " ").title()
    return f"Company {user.id}"


# ══════════════════════════════════════════════════════════════════
# PUBLIC ROUTES
# ══════════════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    return {"status": "active", "message": "Train-to-Hire API is running", "version": "2.0.0"}


@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


# ══════════════════════════════════════════════════════════════════
# AUTH ROUTES
# ══════════════════════════════════════════════════════════════════

@app.post("/auth/register", response_model=AuthOut)
def register(payload: RegisterIn, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo.")

    hashed = auth.hash_password(payload.password)
    verification_token = secrets.token_urlsafe(32)
    new_user = models.User(
        email=payload.email,
        password_hash=hashed,
        role=payload.role,
        profile_data=payload.profile_data,
        email_verified=False,
        verification_token=verification_token,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Enviar correo de verificación (no bloquea el registro si falla)
    email_service.send_verification_email(new_user.email, verification_token)

    _log_event(db, "user_registered", user_id=new_user.id, payload={"role": new_user.role.value})
    db.commit()

    token = auth.create_access_token({"sub": str(new_user.id), "role": new_user.role.value})
    return AuthOut(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        role=new_user.role.value,
    )


@app.post("/auth/login", response_model=AuthOut)
def login(payload: LoginIn, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    if not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    _log_event(db, "user_login", user_id=user.id, payload={"role": user.role.value})
    db.commit()

    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthOut(
        access_token=token,
        user_id=user.id,
        email=user.email,
        role=user.role.value,
    )


@app.get("/auth/me", response_model=UserProfileOut)
def read_current_user(current_user: models.User = Depends(auth.get_current_user)):
    return UserProfileOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        profile_data=current_user.profile_data or {},
    )


@app.patch("/auth/me", response_model=UserProfileOut)
def update_current_profile(
    payload: UserProfileUpdateIn,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    merged = {**(current_user.profile_data or {}), **payload.profile_data}
    current_user.profile_data = merged
    db.commit()
    db.refresh(current_user)
    return UserProfileOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        profile_data=current_user.profile_data or {},
    )


@app.get("/auth/verify-email")
def verify_email(token: str = Query(..., min_length=10), db: Session = Depends(database.get_db)):
    """Verifica el correo del usuario usando el token enviado por email."""
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token de verificación inválido o ya utilizado.")

    user.email_verified = True
    user.verification_token = None
    _log_event(db, "email_verified", user_id=user.id)
    db.commit()
    return {"message": "Correo verificado exitosamente. Ya puedes usar la plataforma."}


@app.post("/auth/resend-verification")
def resend_verification(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Reenvía el correo de verificación al usuario autenticado."""
    if current_user.email_verified:
        return {"message": "Tu correo ya está verificado."}

    new_token = secrets.token_urlsafe(32)
    current_user.verification_token = new_token
    db.commit()
    email_service.send_verification_email(current_user.email, new_token)
    return {"message": "Correo de verificación reenviado."}


# ══════════════════════════════════════════════════════════════════
# STUDENT ROUTES
# ══════════════════════════════════════════════════════════════════

@app.get("/student/opportunities", response_model=list[StudentOpportunityOut])
def read_student_opportunities(
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
    db: Session = Depends(database.get_db),
):
    opportunities = (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.published)
        .all()
    )

    response: list[StudentOpportunityOut] = []
    for opp in opportunities:
        course = opp.course
        is_completed = False
        if course:
            progress = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.course_id == course.id,
            ).first()
            is_completed = bool(progress and progress.is_completed)

        already_applied = db.query(models.Application).filter(
            models.Application.user_id == current_user.id,
            models.Application.opportunity_id == opp.id,
        ).first() is not None

        response.append(
            StudentOpportunityOut(
                id=opp.id,
                title=opp.title,
                description=opp.description,
                requirements=opp.requirements,
                company_id=opp.company_id,
                company_name=_company_display_name(opp.company) if opp.company else f"Company {opp.company_id}",
                status=opp.status,
                course_id=course.id if course else None,
                course_name=course.name if course else None,
                course_modules=[
                    ModuleOut(
                        id=m.id, title=m.title, order=m.order,
                        topics=[TopicOut(id=t.id, title=t.title, content_url=t.content_url, order=t.order) for t in m.topics],
                    ) for m in course.modules
                ] if course else [],
                progress_percent=100 if is_completed else 0,
                course_completed=is_completed,
                can_apply=bool(opp.status == models.OpportunityStatus.published and (not course or is_completed) and not already_applied),
                already_applied=already_applied,
            )
        )

    return response


@app.post("/student/courses/{course_id}/complete", response_model=CourseCompletionOut)
def complete_course(
    course_id: int,
    payload: CourseCompletionIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
    db: Session = Depends(database.get_db),
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id,
    ).first()

    if not progress:
        progress = models.UserProgress(
            user_id=current_user.id,
            course_id=course_id,
            is_completed=True,
            score=payload.score,
        )
        db.add(progress)
    else:
        progress.is_completed = True
        if payload.score is not None:
            progress.score = payload.score

    _log_event(
        db, "course_completed",
        user_id=current_user.id,
        opportunity_id=course.opportunity_id,
        course_id=course_id,
        payload={"score": payload.score},
    )
    db.commit()
    db.refresh(progress)

    return CourseCompletionOut(
        user_id=progress.user_id,
        course_id=progress.course_id,
        is_completed=bool(progress.is_completed),
        score=progress.score,
    )


@app.post("/student/apply")
def apply_to_opportunity(
    payload: ApplyIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
    db: Session = Depends(database.get_db),
):
    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == payload.opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    if opportunity.status != models.OpportunityStatus.published:
        _log_event(db, "apply_blocked_not_published", user_id=current_user.id, opportunity_id=payload.opportunity_id)
        db.commit()
        raise HTTPException(status_code=400, detail="Solo puedes postular a oportunidades publicadas.")

    existing = db.query(models.Application).filter(
        models.Application.user_id == current_user.id,
        models.Application.opportunity_id == payload.opportunity_id,
    ).first()
    if existing:
        return {"message": "Ya te postulaste a esta oportunidad.", "already_applied": True}

    # GATEKEEPER: verificar curso completado
    if opportunity.course:
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == current_user.id,
            models.UserProgress.course_id == opportunity.course.id,
        ).first()
        if not progress or not progress.is_completed:
            _log_event(
                db, "apply_blocked_course_incomplete",
                user_id=current_user.id,
                opportunity_id=payload.opportunity_id,
                course_id=opportunity.course.id,
            )
            db.commit()
            raise HTTPException(status_code=403, detail="Debes completar el curso primero.")

    new_app = models.Application(user_id=current_user.id, opportunity_id=payload.opportunity_id)
    db.add(new_app)
    _log_event(db, "apply_success", user_id=current_user.id, opportunity_id=payload.opportunity_id)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"message": "Ya te postulaste a esta oportunidad.", "already_applied": True}

    return {"message": "Postulacion enviada! Has desbloqueado el siguiente nivel.", "already_applied": False}


@app.get("/student/applications", response_model=list[StudentApplicationOut])
def read_student_applications(
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
    db: Session = Depends(database.get_db),
):
    applications = (
        db.query(models.Application)
        .filter(models.Application.user_id == current_user.id)
        .order_by(models.Application.created_at.desc())
        .all()
    )

    result: list[StudentApplicationOut] = []
    for app_row in applications:
        opp = app_row.opportunity
        company_name = _company_display_name(opp.company) if opp and opp.company else "Desconocida"
        result.append(
            StudentApplicationOut(
                application_id=app_row.id,
                opportunity_id=app_row.opportunity_id,
                opportunity_title=opp.title if opp else "—",
                company_name=company_name,
                applied_at=app_row.created_at.isoformat() if app_row.created_at else "",
            )
        )
    return result


# ── AI: Tutor para estudiantes ──

@app.post("/student/courses/{course_id}/ask", response_model=AITutorOut)
def ask_course_tutor(
    course_id: int,
    payload: AITutorIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.student)),
    db: Session = Depends(database.get_db),
):
    """Pregunta al tutor IA sobre el curso."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    # Serializar módulos para contexto
    modules_ctx = []
    for m in course.modules:
        modules_ctx.append({
            "title": m.title,
            "topics": [{"title": t.title, "content_url": t.content_url} for t in m.topics],
        })

    try:
        answer = ai_service.ask_tutor(
            question=payload.question,
            course_name=course.name,
            course_modules=modules_ctx,
            conversation_history=payload.conversation_history,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error en tutor IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error del tutor: {str(e)}")

    _log_event(
        db, "ai_tutor_query",
        user_id=current_user.id,
        course_id=course_id,
        payload={"question_length": len(payload.question)},
    )
    db.commit()

    return AITutorOut(answer=answer, course_name=course.name)


# ══════════════════════════════════════════════════════════════════
# COMPANY ROUTES
# ══════════════════════════════════════════════════════════════════

@app.post("/company/opportunities", response_model=OpportunityOut)
def create_company_opportunity(
    payload: OpportunityCreateIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.company)),
    db: Session = Depends(database.get_db),
):
    new_opp = models.Opportunity(
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        company_id=current_user.id,
        status=models.OpportunityStatus.pending_review,
    )
    db.add(new_opp)
    db.flush()
    _log_event(
        db, "opportunity_created",
        user_id=current_user.id,
        opportunity_id=new_opp.id,
        payload={"source": "company_panel", "status": "pending_review"},
    )
    db.commit()
    db.refresh(new_opp)
    return new_opp


@app.get("/company/opportunities", response_model=list[OpportunityOut])
def read_company_opportunities(
    current_user: models.User = Depends(auth.require_role(models.UserRole.company)),
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.Opportunity)
        .filter(models.Opportunity.company_id == current_user.id)
        .order_by(models.Opportunity.id.desc())
        .all()
    )


@app.get("/company/opportunities/{opportunity_id}/applicants", response_model=list[ApplicantOut])
def read_opportunity_applicants(
    opportunity_id: int,
    current_user: models.User = Depends(auth.require_role(models.UserRole.company)),
    db: Session = Depends(database.get_db),
):
    opportunity = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.company_id == current_user.id,
    ).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada o no te pertenece.")

    applications = (
        db.query(models.Application)
        .filter(models.Application.opportunity_id == opportunity_id)
        .order_by(models.Application.created_at.desc())
        .all()
    )

    result: list[ApplicantOut] = []
    for app_row in applications:
        user = app_row.user
        course_completed = False
        course_score = None
        if opportunity.course:
            progress = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == user.id,
                models.UserProgress.course_id == opportunity.course.id,
            ).first()
            if progress:
                course_completed = bool(progress.is_completed)
                course_score = progress.score

        result.append(
            ApplicantOut(
                application_id=app_row.id,
                user_id=user.id,
                email=user.email,
                profile_data=user.profile_data or {},
                applied_at=app_row.created_at.isoformat() if app_row.created_at else "",
                course_completed=course_completed,
                course_score=course_score,
            )
        )
    return result


@app.get("/company/stats")
def read_company_stats(
    current_user: models.User = Depends(auth.require_role(models.UserRole.company)),
    db: Session = Depends(database.get_db),
):
    total_opps = db.query(models.Opportunity).filter(models.Opportunity.company_id == current_user.id).count()
    published = db.query(models.Opportunity).filter(
        models.Opportunity.company_id == current_user.id,
        models.Opportunity.status == models.OpportunityStatus.published,
    ).count()
    pending = db.query(models.Opportunity).filter(
        models.Opportunity.company_id == current_user.id,
        models.Opportunity.status == models.OpportunityStatus.pending_review,
    ).count()

    opp_ids = [o.id for o in db.query(models.Opportunity.id).filter(models.Opportunity.company_id == current_user.id).all()]
    total_applicants = 0
    if opp_ids:
        total_applicants = db.query(models.Application).filter(models.Application.opportunity_id.in_(opp_ids)).count()

    return {
        "total_opportunities": total_opps,
        "published": published,
        "pending_review": pending,
        "total_applicants": total_applicants,
    }


# ── AI: Scoring de aplicaciones ──

@app.post("/admin/applications/{application_id}/score", response_model=AIScoreOut)
def score_application_with_ai(
    application_id: int,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Evalúa un aplicante con IA basándose en su perfil vs la oportunidad."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada")

    student = application.user
    opportunity = application.opportunity

    course_completed = False
    course_score = None
    if opportunity.course:
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == student.id,
            models.UserProgress.course_id == opportunity.course.id,
        ).first()
        if progress:
            course_completed = bool(progress.is_completed)
            course_score = progress.score

    try:
        result = ai_service.score_application(
            student_profile=student.profile_data or {},
            student_email=student.email,
            opportunity_title=opportunity.title,
            opportunity_description=opportunity.description,
            opportunity_requirements=opportunity.requirements or "",
            course_completed=course_completed,
            course_score=course_score,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error scoring con IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")

    _log_event(
        db, "ai_scoring",
        user_id=current_user.id,
        opportunity_id=opportunity.id,
        payload={"application_id": application_id, "score": result["score"]},
    )
    db.commit()

    return AIScoreOut(**result)


@app.post("/company/opportunities/{opportunity_id}/applicants/{application_id}/score", response_model=AIScoreOut)
def company_score_applicant(
    opportunity_id: int,
    application_id: int,
    current_user: models.User = Depends(auth.require_role(models.UserRole.company)),
    db: Session = Depends(database.get_db),
):
    """La empresa evalúa con IA a un aplicante de su oportunidad."""
    opportunity = db.query(models.Opportunity).filter(
        models.Opportunity.id == opportunity_id,
        models.Opportunity.company_id == current_user.id,
    ).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada o no te pertenece.")

    application = db.query(models.Application).filter(
        models.Application.id == application_id,
        models.Application.opportunity_id == opportunity_id,
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Aplicación no encontrada.")

    student = application.user

    course_completed = False
    course_score = None
    if opportunity.course:
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == student.id,
            models.UserProgress.course_id == opportunity.course.id,
        ).first()
        if progress:
            course_completed = bool(progress.is_completed)
            course_score = progress.score

    try:
        result = ai_service.score_application(
            student_profile=student.profile_data or {},
            student_email=student.email,
            opportunity_title=opportunity.title,
            opportunity_description=opportunity.description,
            opportunity_requirements=opportunity.requirements or "",
            course_completed=course_completed,
            course_score=course_score,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error scoring con IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")

    _log_event(
        db, "ai_scoring",
        user_id=current_user.id,
        opportunity_id=opportunity_id,
        payload={"application_id": application_id, "score": result["score"]},
    )
    db.commit()

    return AIScoreOut(**result)


# ══════════════════════════════════════════════════════════════════
# ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════

@app.get("/admin/opportunities/pending", response_model=list[OpportunityOut])
def read_pending_opportunities(
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.pending_review)
        .order_by(models.Opportunity.id.desc())
        .all()
    )


@app.patch("/admin/opportunities/{opportunity_id}/publish", response_model=OpportunityOut)
def publish_opportunity(
    opportunity_id: int,
    payload: PublishWithCourseIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
    if opportunity.status == models.OpportunityStatus.closed:
        raise HTTPException(status_code=400, detail="No se puede publicar una oportunidad cerrada")
    if opportunity.status == models.OpportunityStatus.published:
        return opportunity

    # Buscar curso del catálogo
    catalog_course = db.query(models.Course).filter(
        models.Course.id == payload.catalog_course_id,
        models.Course.opportunity_id.is_(None),
        models.Course.is_active.is_(True),
    ).first()
    if not catalog_course:
        raise HTTPException(status_code=404, detail="Curso del catálogo no encontrado o no disponible.")

    # Crear copia del curso vinculada a la oportunidad
    linked_course = db.query(models.Course).filter(models.Course.opportunity_id == opportunity_id).first()
    if not linked_course:
        linked_course = models.Course(
            opportunity_id=opportunity_id,
            name=catalog_course.name,
            description=catalog_course.description,
        )
        db.add(linked_course)
        db.flush()
    else:
        linked_course.name = catalog_course.name
        linked_course.description = catalog_course.description
        # Borrar módulos viejos antes de clonar
        for old_mod in linked_course.modules:
            db.delete(old_mod)
        db.flush()

    # Clonar módulos y temas del catálogo
    for src_mod in catalog_course.modules:
        new_mod = models.CourseModule(course_id=linked_course.id, title=src_mod.title, order=src_mod.order)
        db.add(new_mod)
        db.flush()
        for src_topic in src_mod.topics:
            db.add(models.CourseTopic(module_id=new_mod.id, title=src_topic.title, content_url=src_topic.content_url, order=src_topic.order))
    db.flush()

    _log_event(
        db, "course_assigned_from_catalog",
        user_id=current_user.id,
        opportunity_id=opportunity_id,
        course_id=linked_course.id,
        payload={"catalog_course_id": catalog_course.id, "course_name": catalog_course.name},
    )

    opportunity.status = models.OpportunityStatus.published
    _log_event(db, "opportunity_published", user_id=current_user.id, opportunity_id=opportunity.id, payload={"status": "published"})
    db.commit()
    db.refresh(opportunity)
    return opportunity


# ── Helper: serializar curso con módulos/temas ──

def _serialize_catalog_course(c: models.Course) -> dict:
    return CatalogCourseOut(
        id=c.id, name=c.name, description=c.description, is_active=c.is_active,
        modules=[
            ModuleOut(
                id=m.id, title=m.title, order=m.order,
                topics=[TopicOut(id=t.id, title=t.title, content_url=t.content_url, order=t.order) for t in m.topics],
            ) for m in c.modules
        ],
    )


def _serialize_catalog_list_item(c: models.Course) -> dict:
    topic_count = sum(len(m.topics) for m in c.modules)
    return CatalogCourseListOut(
        id=c.id, name=c.name, description=c.description, is_active=c.is_active,
        module_count=len(c.modules), topic_count=topic_count,
    )


def _save_modules_topics(db: Session, course: models.Course, modules_in: list) -> None:
    """Reemplaza los módulos/temas de un curso con los datos nuevos."""
    # Borrar módulos existentes (cascade borra temas)
    for old_mod in list(course.modules):
        db.delete(old_mod)
    db.flush()

    for mod_data in modules_in:
        new_mod = models.CourseModule(course_id=course.id, title=mod_data.title, order=mod_data.order)
        db.add(new_mod)
        db.flush()
        for topic_data in mod_data.topics:
            db.add(models.CourseTopic(
                module_id=new_mod.id, title=topic_data.title,
                content_url=topic_data.content_url, order=topic_data.order,
            ))
    db.flush()


# ── Course Catalog CRUD ──

@app.get("/admin/courses", response_model=list[CatalogCourseListOut])
def list_catalog_courses(
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Lista cursos del catálogo (resumen sin temas)."""
    courses = (
        db.query(models.Course)
        .filter(models.Course.opportunity_id.is_(None), models.Course.is_active.is_(True))
        .order_by(models.Course.id.desc())
        .all()
    )
    return [_serialize_catalog_list_item(c) for c in courses]


@app.get("/admin/courses/{course_id}", response_model=CatalogCourseOut)
def get_catalog_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Detalle de un curso con módulos y temas."""
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.opportunity_id.is_(None),
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso del catálogo no encontrado.")
    return _serialize_catalog_course(course)


@app.post("/admin/courses", response_model=CatalogCourseOut, status_code=201)
def create_catalog_course(
    payload: CatalogCourseCreateIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Crea un curso con módulos y temas anidados."""
    course = models.Course(
        name=payload.name,
        description=payload.description,
        opportunity_id=None,
        is_active=True,
    )
    db.add(course)
    db.flush()
    _save_modules_topics(db, course, payload.modules)
    _log_event(db, "catalog_course_created", user_id=current_user.id, payload={"name": payload.name})
    db.commit()
    db.refresh(course)
    return _serialize_catalog_course(course)


@app.patch("/admin/courses/{course_id}", response_model=CatalogCourseOut)
def update_catalog_course(
    course_id: int,
    payload: CatalogCourseUpdateIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Edita un curso del catálogo. Si se envían modules, se reemplazan todos."""
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.opportunity_id.is_(None),
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso del catálogo no encontrado.")
    if payload.name is not None:
        course.name = payload.name
    if payload.description is not None:
        course.description = payload.description
    if payload.modules is not None:
        _save_modules_topics(db, course, payload.modules)
    _log_event(db, "catalog_course_updated", user_id=current_user.id, course_id=course.id)
    db.commit()
    db.refresh(course)
    return _serialize_catalog_course(course)


@app.delete("/admin/courses/{course_id}")
def delete_catalog_course(
    course_id: int,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Desactiva (soft-delete) un curso del catálogo."""
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.opportunity_id.is_(None),
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso del catálogo no encontrado.")
    course.is_active = False
    _log_event(db, "catalog_course_deleted", user_id=current_user.id, course_id=course.id)
    db.commit()
    return {"message": "Curso desactivado del catálogo."}


# ── AI: Generar curso con IA ──

@app.post("/admin/courses/generate", response_model=CatalogCourseOut, status_code=201)
def generate_course_with_ai(
    payload: AIGenerateCourseIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Genera un curso completo usando IA y lo guarda en el catálogo."""
    try:
        ai_result = ai_service.generate_course(
            course_name=payload.name,
            description=payload.description,
            requirements=payload.requirements,
            num_modules=payload.num_modules,
            topics_per_module=payload.topics_per_module,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error generando curso con IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")

    # Guardar el curso generado
    course = models.Course(
        name=ai_result.get("name", payload.name),
        description=ai_result.get("description"),
        opportunity_id=None,
        is_active=True,
        quiz_data={"questions": ai_result.get("quiz_questions", [])},
    )
    db.add(course)
    db.flush()

    for mod_data in ai_result.get("modules", []):
        new_mod = models.CourseModule(
            course_id=course.id,
            title=mod_data["title"],
            order=mod_data.get("order", 0),
        )
        db.add(new_mod)
        db.flush()
        for topic_data in mod_data.get("topics", []):
            db.add(models.CourseTopic(
                module_id=new_mod.id,
                title=topic_data["title"],
                content_url=topic_data.get("content_url"),
                order=topic_data.get("order", 0),
            ))
    db.flush()

    _log_event(
        db, "catalog_course_generated_ai",
        user_id=current_user.id,
        course_id=course.id,
        payload={"name": payload.name, "modules": len(ai_result.get("modules", []))},
    )
    db.commit()
    db.refresh(course)
    return _serialize_catalog_course(course)


@app.post("/admin/courses/generate/preview")
def preview_ai_course(
    payload: AIGenerateCourseIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
):
    """Genera un curso con IA sin guardarlo, para previsualización."""
    try:
        ai_result = ai_service.generate_course(
            course_name=payload.name,
            description=payload.description,
            requirements=payload.requirements,
            num_modules=payload.num_modules,
            topics_per_module=payload.topics_per_module,
        )
        return ai_result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error generando preview con IA: {e}")
        raise HTTPException(status_code=500, detail=f"Error de IA: {str(e)}")


@app.get("/admin/metrics/summary", response_model=MetricsSummaryOut)
def read_metrics_summary(
    window_days: int = 30,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    normalized_days = max(1, min(window_days, 365))
    since = datetime.now(timezone.utc) - timedelta(days=normalized_days)

    def _count_events(event_types: list[str]) -> int:
        return (
            db.query(models.AnalyticsEvent)
            .filter(models.AnalyticsEvent.event_type.in_(event_types), models.AnalyticsEvent.created_at >= since)
            .count()
        )

    total_users = db.query(models.User).count()
    total_students = db.query(models.User).filter(models.User.role == models.UserRole.student).count()
    total_companies = db.query(models.User).filter(models.User.role == models.UserRole.company).count()

    opportunities_created = _count_events(["opportunity_created"])
    opportunities_published = _count_events(["opportunity_published"])
    course_completions = _count_events(["course_completed"])
    apply_success = _count_events(["apply_success"])
    apply_blocked = _count_events(["apply_blocked_not_published", "apply_blocked_course_incomplete"])
    apply_attempts = apply_success + apply_blocked + _count_events(["apply_duplicate"])

    pending_opportunities = db.query(models.Opportunity).filter(models.Opportunity.status == models.OpportunityStatus.pending_review).count()
    published_opportunities = db.query(models.Opportunity).filter(models.Opportunity.status == models.OpportunityStatus.published).count()

    total_progress = db.query(models.UserProgress).count()
    completed_progress = db.query(models.UserProgress).filter(models.UserProgress.is_completed.is_(True)).count()
    unlock_rate = (completed_progress / total_progress * 100.0) if total_progress else 0.0
    apply_success_rate = (apply_success / apply_attempts * 100.0) if apply_attempts else 0.0

    return MetricsSummaryOut(
        window_days=normalized_days,
        total_users=total_users,
        total_students=total_students,
        total_companies=total_companies,
        opportunities_created=opportunities_created,
        opportunities_published=opportunities_published,
        pending_opportunities=pending_opportunities,
        published_opportunities=published_opportunities,
        course_completions=course_completions,
        apply_attempts=apply_attempts,
        apply_success=apply_success,
        apply_blocked=apply_blocked,
        unlock_rate_percent=round(unlock_rate, 2),
        apply_success_rate_percent=round(apply_success_rate, 2),
    )


@app.get("/admin/users")
def read_all_users(
    role: Optional[str] = Query(default=None),
    pagination: PaginationParams = Depends(),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    total = query.count()
    users = query.order_by(models.User.id.desc()).offset(pagination.offset).limit(pagination.page_size).all()
    return PaginatedOut(
        items=[AdminUserOut(id=u.id, email=u.email, role=u.role.value, profile_data=u.profile_data or {}).model_dump() for u in users],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total else 1,
    )


@app.get("/admin/opportunities/all")
def read_all_opportunities(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    pagination: PaginationParams = Depends(),
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Opportunity)
    if status_filter:
        query = query.filter(models.Opportunity.status == status_filter)
    total = query.count()
    items = query.order_by(models.Opportunity.id.desc()).offset(pagination.offset).limit(pagination.page_size).all()
    return PaginatedOut(
        items=[OpportunityOut.model_validate(o, from_attributes=True).model_dump() for o in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total else 1,
    )


# ══════════════════════════════════════════════════════════════════
# PUBLIC ENDPOINTS (sin auth)
# ══════════════════════════════════════════════════════════════════

@app.get("/opportunities/")
def read_public_opportunities(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Opportunity).filter(models.Opportunity.status == models.OpportunityStatus.published)
    total = query.count()
    items = query.order_by(models.Opportunity.id.desc()).offset(pagination.offset).limit(pagination.page_size).all()
    return PaginatedOut(
        items=[OpportunityOut.model_validate(o, from_attributes=True).model_dump() for o in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=math.ceil(total / pagination.page_size) if total else 1,
    )


@app.post("/contact/", response_model=ContactMessageOut)
def create_contact_message(payload: ContactMessageIn, db: Session = Depends(database.get_db)):
    new_message = models.ContactMessage(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(new_message)
    db.commit()
    return ContactMessageOut(message="Mensaje recibido. Te contactaremos pronto.")
