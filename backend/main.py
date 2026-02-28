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
    course_content_url: Optional[str] = None
    progress_percent: int
    course_completed: bool
    can_apply: bool
    already_applied: bool = False


# ── Course ──
class AdminCourseUpsertIn(StrictModel):
    name: str = Field(min_length=3, max_length=255)
    content_url: str
    quiz_data: dict = Field(default_factory=dict)

    @field_validator("content_url")
    @classmethod
    def validate_content_url(cls, value: str) -> str:
        normalized = value.strip()
        if not (normalized.startswith("http://") or normalized.startswith("https://")):
            raise ValueError("content_url debe iniciar con http:// o https://")
        return normalized


class PublishWithCourseIn(StrictModel):
    """Al publicar se selecciona un curso del catálogo."""
    catalog_course_id: int


class CatalogCourseCreateIn(StrictModel):
    """Crear un curso en el catálogo (sin oportunidad asociada)."""
    name: str = Field(min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    content_url: str

    @field_validator("content_url")
    @classmethod
    def validate_content_url(cls, value: str) -> str:
        normalized = value.strip()
        if not (normalized.startswith("http://") or normalized.startswith("https://")):
            raise ValueError("content_url debe iniciar con http:// o https://")
        return normalized


class CatalogCourseUpdateIn(StrictModel):
    """Editar un curso del catálogo."""
    name: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    content_url: Optional[str] = None

    @field_validator("content_url")
    @classmethod
    def validate_content_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        normalized = value.strip()
        if not (normalized.startswith("http://") or normalized.startswith("https://")):
            raise ValueError("content_url debe iniciar con http:// o https://")
        return normalized


class CatalogCourseOut(StrictModel):
    id: int
    name: str
    description: Optional[str] = None
    content_url: str
    is_active: bool


class CourseOut(StrictModel):
    id: int
    opportunity_id: Optional[int] = None
    name: str
    content_url: str
    quiz_data: dict


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
                course_content_url=course.content_url if course else None,
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
            content_url=catalog_course.content_url,
        )
        db.add(linked_course)
        db.flush()
    else:
        linked_course.name = catalog_course.name
        linked_course.description = catalog_course.description
        linked_course.content_url = catalog_course.content_url

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


# ── Course Catalog CRUD ──

@app.get("/admin/courses", response_model=list[CatalogCourseOut])
def list_catalog_courses(
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Lista cursos del catálogo (sin oportunidad vinculada, activos)."""
    courses = (
        db.query(models.Course)
        .filter(models.Course.opportunity_id.is_(None), models.Course.is_active.is_(True))
        .order_by(models.Course.id.desc())
        .all()
    )
    return [
        CatalogCourseOut(
            id=c.id, name=c.name, description=c.description,
            content_url=c.content_url, is_active=c.is_active,
        )
        for c in courses
    ]


@app.post("/admin/courses", response_model=CatalogCourseOut, status_code=201)
def create_catalog_course(
    payload: CatalogCourseCreateIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Crea un curso en el catálogo (sin asociar a oportunidad)."""
    course = models.Course(
        name=payload.name,
        description=payload.description,
        content_url=payload.content_url,
        opportunity_id=None,
        is_active=True,
    )
    db.add(course)
    _log_event(db, "catalog_course_created", user_id=current_user.id, payload={"name": payload.name})
    db.commit()
    db.refresh(course)
    return CatalogCourseOut(
        id=course.id, name=course.name, description=course.description,
        content_url=course.content_url, is_active=course.is_active,
    )


@app.patch("/admin/courses/{course_id}", response_model=CatalogCourseOut)
def update_catalog_course(
    course_id: int,
    payload: CatalogCourseUpdateIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    """Edita un curso del catálogo."""
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
    if payload.content_url is not None:
        course.content_url = payload.content_url
    _log_event(db, "catalog_course_updated", user_id=current_user.id, course_id=course.id)
    db.commit()
    db.refresh(course)
    return CatalogCourseOut(
        id=course.id, name=course.name, description=course.description,
        content_url=course.content_url, is_active=course.is_active,
    )


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


@app.patch("/admin/opportunities/{opportunity_id}/course", response_model=CourseOut)
def upsert_opportunity_course(
    opportunity_id: int,
    payload: AdminCourseUpsertIn,
    current_user: models.User = Depends(auth.require_role(models.UserRole.admin)),
    db: Session = Depends(database.get_db),
):
    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    course = db.query(models.Course).filter(models.Course.opportunity_id == opportunity_id).first()
    if not course:
        course = models.Course(opportunity_id=opportunity_id, name=payload.name, content_url=payload.content_url, quiz_data=payload.quiz_data)
        db.add(course)
        db.flush()
    else:
        course.name = payload.name
        course.content_url = payload.content_url
        course.quiz_data = payload.quiz_data

    _log_event(db, "course_upserted", user_id=current_user.id, opportunity_id=opportunity_id, course_id=course.id, payload={"name": payload.name, "content_url": payload.content_url})
    db.commit()
    db.refresh(course)

    return CourseOut(id=course.id, opportunity_id=course.opportunity_id, name=course.name, content_url=course.content_url, quiz_data=course.quiz_data or {})


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
