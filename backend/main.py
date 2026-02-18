from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
import models
import database

app = FastAPI(title="Train-To-Hire API")

# 2. Configurar CORS (Para que el Frontend de React pueda conectarse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- VALIDACIONES (Pydantic) ---
class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class UserCreate(StrictModel):
    email: str
    password: Optional[str] = None
    password_hash: Optional[str] = None
    role: models.UserRole
    profile_data: dict = Field(default_factory=dict)

class OpportunityCreate(StrictModel):
    title: str = Field(min_length=4, max_length=180)
    description: str = Field(min_length=10, max_length=3000)
    company_id: int
    requirements: Optional[str] = Field(default=None, max_length=2000)


class OpportunityPublish(StrictModel):
    admin_id: int


class OpportunityOut(StrictModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    status: models.OpportunityStatus


class StudentOpportunityOut(StrictModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    company_name: str
    status: models.OpportunityStatus
    course_id: Optional[int] = None
    course_content_url: Optional[str] = None
    progress_percent: int
    course_completed: bool
    can_apply: bool


class OpportunityCompanyCreate(StrictModel):
    actor_user_id: int
    title: str = Field(min_length=4, max_length=180)
    description: str = Field(min_length=10, max_length=3000)
    requirements: Optional[str] = Field(default=None, max_length=2000)

class ApplicationCreate(StrictModel):
    user_id: int
    opportunity_id: int


class AdminCourseUpsertIn(StrictModel):
    admin_id: int
    content_url: str
    quiz_data: dict = Field(default_factory=dict)

    @field_validator("content_url")
    @classmethod
    def validate_content_url(cls, value: str) -> str:
        normalized = value.strip()
        if not (normalized.startswith("http://") or normalized.startswith("https://")):
            raise ValueError("content_url debe iniciar con http:// o https://")
        return normalized


class CourseOut(StrictModel):
    id: int
    opportunity_id: int
    content_url: str
    quiz_data: dict


class CourseCompletionIn(StrictModel):
    user_id: int
    score: Optional[int] = Field(default=None, ge=0, le=100)


class CourseCompletionOut(StrictModel):
    user_id: int
    course_id: int
    is_completed: bool
    score: Optional[int] = None


class MetricsSummaryOut(StrictModel):
    window_days: int
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


def _get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def _require_role(user: models.User, required_role: models.UserRole) -> None:
    if user.role != required_role:
        raise HTTPException(
            status_code=403,
            detail=f"Acceso denegado: se requiere rol '{required_role.value}'.",
        )


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

# --- RUTAS (ENDPOINTS) ---

@app.get("/")
def read_root():
    return {"status": "active", "message": "Train-to-Hire API is running 🚀"}


@app.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}

# Crear Usuario
@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        return {"email": db_user.email, "id": db_user.id, "user_id": db_user.id}

    resolved_password_hash = user.password_hash or user.password or "demo_password_hash"
    new_user = models.User(
        email=user.email,
        password_hash=resolved_password_hash,
        role=user.role,
        profile_data=user.profile_data,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"email": new_user.email, "id": new_user.id, "user_id": new_user.id}

# Crear Oportunidad
@app.post("/opportunities/")
def create_opportunity(opp: OpportunityCreate, db: Session = Depends(database.get_db)):
    company_user = _get_user_or_404(db, opp.company_id)
    _require_role(company_user, models.UserRole.company)

    new_opp = models.Opportunity(
        title=opp.title,
        description=opp.description,
        company_id=opp.company_id,
        requirements=opp.requirements,
        status=models.OpportunityStatus.pending_review,
    )
    db.add(new_opp)
    db.commit()
    db.refresh(new_opp)
    return new_opp


@app.post("/company/opportunities/", response_model=OpportunityOut)
def create_company_opportunity(payload: OpportunityCompanyCreate, db: Session = Depends(database.get_db)):
    actor = _get_user_or_404(db, payload.actor_user_id)
    _require_role(actor, models.UserRole.company)

    new_opp = models.Opportunity(
        title=payload.title,
        description=payload.description,
        requirements=payload.requirements,
        company_id=actor.id,
        status=models.OpportunityStatus.pending_review,
    )
    db.add(new_opp)
    db.flush()
    _log_event(
        db,
        "opportunity_created",
        user_id=actor.id,
        opportunity_id=new_opp.id,
        payload={"source": "company_panel", "status": "pending_review"},
    )
    db.commit()
    db.refresh(new_opp)
    return new_opp


@app.get("/company/opportunities/", response_model=list[OpportunityOut])
def read_company_opportunities(company_id: int, db: Session = Depends(database.get_db)):
    company = _get_user_or_404(db, company_id)
    _require_role(company, models.UserRole.company)

    return (
        db.query(models.Opportunity)
        .filter(models.Opportunity.company_id == company_id)
        .order_by(models.Opportunity.id.desc())
        .all()
    )


@app.patch("/admin/opportunities/{opportunity_id}/publish", response_model=OpportunityOut)
def publish_opportunity(opportunity_id: int, payload: OpportunityPublish, db: Session = Depends(database.get_db)):
    admin_user = _get_user_or_404(db, payload.admin_id)
    _require_role(admin_user, models.UserRole.admin)

    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    if opportunity.status == models.OpportunityStatus.closed:
        raise HTTPException(status_code=400, detail="No se puede publicar una oportunidad cerrada")

    if opportunity.status == models.OpportunityStatus.published:
        return opportunity

    opportunity.status = models.OpportunityStatus.published
    _log_event(
        db,
        "opportunity_published",
        user_id=admin_user.id,
        opportunity_id=opportunity.id,
        payload={"status": "published"},
    )
    db.commit()
    db.refresh(opportunity)
    return opportunity


@app.get("/admin/opportunities/pending", response_model=list[OpportunityOut])
def read_pending_opportunities(admin_id: int, db: Session = Depends(database.get_db)):
    admin_user = _get_user_or_404(db, admin_id)
    _require_role(admin_user, models.UserRole.admin)

    return (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.pending_review)
        .order_by(models.Opportunity.id.desc())
        .all()
    )


@app.patch("/admin/opportunities/{opportunity_id}/course", response_model=CourseOut)
def upsert_opportunity_course(opportunity_id: int, payload: AdminCourseUpsertIn, db: Session = Depends(database.get_db)):
    admin_user = _get_user_or_404(db, payload.admin_id)
    _require_role(admin_user, models.UserRole.admin)

    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    course = db.query(models.Course).filter(models.Course.opportunity_id == opportunity_id).first()
    if not course:
        course = models.Course(
            opportunity_id=opportunity_id,
            content_url=payload.content_url,
            quiz_data=payload.quiz_data,
        )
        db.add(course)
        db.flush()
    else:
        course.content_url = payload.content_url
        course.quiz_data = payload.quiz_data

    _log_event(
        db,
        "course_upserted",
        user_id=admin_user.id,
        opportunity_id=opportunity_id,
        course_id=course.id,
        payload={"content_url": payload.content_url},
    )

    db.commit()
    db.refresh(course)

    return CourseOut(
        id=course.id,
        opportunity_id=course.opportunity_id,
        content_url=course.content_url,
        quiz_data=course.quiz_data or {},
    )

# Ver Oportunidades
@app.get("/opportunities/")
def read_opportunities(db: Session = Depends(database.get_db)):
    return (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.published)
        .all()
    )


@app.get("/students/{student_id}/opportunities/", response_model=list[StudentOpportunityOut])
def read_student_opportunities(student_id: int, db: Session = Depends(database.get_db)):
    student = _get_user_or_404(db, student_id)
    _require_role(student, models.UserRole.student)
    opportunities = (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.published)
        .all()
    )

    response: list[StudentOpportunityOut] = []
    for opportunity in opportunities:
        course = opportunity.course
        is_completed = False
        if course:
            progress = db.query(models.UserProgress).filter(
                models.UserProgress.user_id == student_id,
                models.UserProgress.course_id == course.id,
            ).first()
            is_completed = bool(progress and progress.is_completed)

        company_name = f"Company {opportunity.company_id}"
        if opportunity.company and opportunity.company.email:
            company_name = opportunity.company.email.split("@")[0].replace(".", " ").title()

        response.append(
            StudentOpportunityOut(
                id=opportunity.id,
                title=opportunity.title,
                description=opportunity.description,
                requirements=opportunity.requirements,
                company_id=opportunity.company_id,
                company_name=company_name,
                status=opportunity.status,
                course_id=course.id if course else None,
                course_content_url=course.content_url if course else None,
                progress_percent=100 if is_completed else 0,
                course_completed=is_completed,
                can_apply=bool(opportunity.status == models.OpportunityStatus.published and (not course or is_completed)),
            )
        )

    return response


@app.post("/courses/{course_id}/complete", response_model=CourseCompletionOut)
def complete_course(course_id: int, payload: CourseCompletionIn, db: Session = Depends(database.get_db)):
    student = _get_user_or_404(db, payload.user_id)
    _require_role(student, models.UserRole.student)

    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == payload.user_id,
        models.UserProgress.course_id == course_id,
    ).first()

    if not progress:
        progress = models.UserProgress(
            user_id=payload.user_id,
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
        db,
        "course_completed",
        user_id=payload.user_id,
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

# EL CANDADO (Intentar Postular)
@app.post("/apply/")
def apply_to_opportunity(application: ApplicationCreate, db: Session = Depends(database.get_db)):
    student = _get_user_or_404(db, application.user_id)
    _require_role(student, models.UserRole.student)

    # Buscar oportunidad y curso
    opportunity = db.query(models.Opportunity).filter(models.Opportunity.id == application.opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    if opportunity.status != models.OpportunityStatus.published:
        _log_event(
            db,
            "apply_blocked_not_published",
            user_id=application.user_id,
            opportunity_id=application.opportunity_id,
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Solo puedes postular a oportunidades publicadas")

    existing_application = db.query(models.Application).filter(
        models.Application.user_id == application.user_id,
        models.Application.opportunity_id == application.opportunity_id,
    ).first()
    if existing_application:
        _log_event(
            db,
            "apply_duplicate",
            user_id=application.user_id,
            opportunity_id=application.opportunity_id,
        )
        db.commit()
        return {"message": "Ya te postulaste a esta oportunidad."}
    
    # VERIFICAR PROGRESO (The Gatekeeper)
    if opportunity.course:
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == application.user_id,
            models.UserProgress.course_id == opportunity.course.id
        ).first()
        
        # Si no hay progreso o no está completo -> BLOQUEAR
        if not progress or not progress.is_completed:
            _log_event(
                db,
                "apply_blocked_course_incomplete",
                user_id=application.user_id,
                opportunity_id=application.opportunity_id,
                course_id=opportunity.course.id,
            )
            db.commit()
            raise HTTPException(status_code=403, detail="🔒 ACCESO DENEGADO: Debes completar el curso primero.")

    # Si pasa el filtro -> APROBAR
    new_app = models.Application(user_id=application.user_id, opportunity_id=application.opportunity_id)
    db.add(new_app)
    _log_event(
        db,
        "apply_success",
        user_id=application.user_id,
        opportunity_id=application.opportunity_id,
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        db.add(
            models.AnalyticsEvent(
                event_type="apply_duplicate",
                user_id=application.user_id,
                opportunity_id=application.opportunity_id,
                payload={"source": "integrity_error"},
            )
        )
        db.commit()
        return {"message": "Ya te postulaste a esta oportunidad."}

    return {"message": "¡Postulación enviada! 🔓 Has desbloqueado el siguiente nivel."}


@app.get("/admin/metrics/summary", response_model=MetricsSummaryOut)
def read_metrics_summary(admin_id: int, window_days: int = 30, db: Session = Depends(database.get_db)):
    admin = _get_user_or_404(db, admin_id)
    _require_role(admin, models.UserRole.admin)

    normalized_days = max(1, min(window_days, 365))
    since = datetime.now(timezone.utc) - timedelta(days=normalized_days)

    def _count_events(event_types: list[str]) -> int:
        return (
            db.query(models.AnalyticsEvent)
            .filter(models.AnalyticsEvent.event_type.in_(event_types))
            .filter(models.AnalyticsEvent.created_at >= since)
            .count()
        )

    opportunities_created = _count_events(["opportunity_created"])
    opportunities_published = _count_events(["opportunity_published"])
    course_completions = _count_events(["course_completed"])
    apply_success = _count_events(["apply_success"])
    apply_blocked = _count_events(["apply_blocked_not_published", "apply_blocked_course_incomplete"])
    apply_attempts = apply_success + apply_blocked + _count_events(["apply_duplicate"])

    pending_opportunities = (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.pending_review)
        .count()
    )
    published_opportunities = (
        db.query(models.Opportunity)
        .filter(models.Opportunity.status == models.OpportunityStatus.published)
        .count()
    )

    total_progress_records = db.query(models.UserProgress).count()
    completed_progress_records = db.query(models.UserProgress).filter(models.UserProgress.is_completed.is_(True)).count()
    unlock_rate = (completed_progress_records / total_progress_records * 100.0) if total_progress_records else 0.0
    apply_success_rate = (apply_success / apply_attempts * 100.0) if apply_attempts else 0.0

    return MetricsSummaryOut(
        window_days=normalized_days,
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

    return ContactMessageOut(
        message="Mensaje recibido. Te contactaremos pronto.",
    )