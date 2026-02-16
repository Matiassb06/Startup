from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import models
import database

# 1. Crear tablas automáticamente
models.Base.metadata.create_all(bind=database.engine)

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
class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    password_hash: Optional[str] = None
    role: models.UserRole
    profile_data: dict = Field(default_factory=dict)

class OpportunityCreate(BaseModel):
    title: str
    description: str
    company_id: int
    requirements: Optional[str] = None


class OpportunityPublish(BaseModel):
    admin_id: int


class OpportunityOut(BaseModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    status: models.OpportunityStatus


class StudentOpportunityOut(BaseModel):
    id: int
    title: str
    description: str
    requirements: Optional[str] = None
    company_id: int
    company_name: str
    status: models.OpportunityStatus
    course_id: Optional[int] = None
    course_completed: bool


class OpportunityCompanyCreate(BaseModel):
    actor_user_id: int
    title: str
    description: str
    requirements: Optional[str] = None

class ApplicationCreate(BaseModel):
    user_id: int
    opportunity_id: int


class AdminCourseUpsertIn(BaseModel):
    admin_id: int
    content_url: str
    quiz_data: dict = Field(default_factory=dict)


class CourseOut(BaseModel):
    id: int
    opportunity_id: int
    content_url: str
    quiz_data: dict


class CourseCompletionIn(BaseModel):
    user_id: int
    score: Optional[int] = None


class CourseCompletionOut(BaseModel):
    user_id: int
    course_id: int
    is_completed: bool
    score: Optional[int] = None


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

# --- RUTAS (ENDPOINTS) ---

@app.get("/")
def read_root():
    return {"status": "active", "message": "Train-to-Hire API is running 🚀"}

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
    db.commit()
    db.refresh(new_opp)
    return new_opp


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
    else:
        course.content_url = payload.content_url
        course.quiz_data = payload.quiz_data

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
                course_completed=is_completed,
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
        raise HTTPException(status_code=400, detail="Solo puedes postular a oportunidades publicadas")

    existing_application = db.query(models.Application).filter(
        models.Application.user_id == application.user_id,
        models.Application.opportunity_id == application.opportunity_id,
    ).first()
    if existing_application:
        return {"message": "Ya te postulaste a esta oportunidad."}
    
    # VERIFICAR PROGRESO (The Gatekeeper)
    if opportunity.course:
        progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == application.user_id,
            models.UserProgress.course_id == opportunity.course.id
        ).first()
        
        # Si no hay progreso o no está completo -> BLOQUEAR
        if not progress or not progress.is_completed:
            raise HTTPException(status_code=403, detail="🔒 ACCESO DENEGADO: Debes completar el curso primero.")

    # Si pasa el filtro -> APROBAR
    new_app = models.Application(user_id=application.user_id, opportunity_id=application.opportunity_id)
    db.add(new_app)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"message": "Ya te postulaste a esta oportunidad."}

    return {"message": "¡Postulación enviada! 🔓 Has desbloqueado el siguiente nivel."}