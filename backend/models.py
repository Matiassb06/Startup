import enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Enum as SQLEnum,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from database import Base

class UserRole(str, enum.Enum):
    student = "student"
    company = "company"
    admin = "admin"

class OpportunityStatus(str, enum.Enum):
    draft = "draft"
    pending_review = "pending_review"
    published = "published"
    closed = "closed"

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(SQLEnum(UserRole, name="user_role", native_enum=True), nullable=False)
    profile_data = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    email_verified = Column(Boolean, nullable=False, server_default=text("false"))
    verification_token = Column(String(255), nullable=True)

    company_opportunities = relationship(
        "Opportunity",
        back_populates="company",
        foreign_keys="Opportunity.company_id",
    )
    progress_records = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    status = Column(
        SQLEnum(OpportunityStatus, name="opportunity_status", native_enum=True),
        nullable=False,
        server_default=text("'pending_review'"),
    )

    company = relationship("User", back_populates="company_opportunities", foreign_keys=[company_id])
    course = relationship("Course", back_populates="opportunity", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="opportunity", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    opportunity_id = Column(
        BigInteger,
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    content_url = Column(Text, nullable=False)
    quiz_data = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    opportunity = relationship("Opportunity", back_populates="course")
    progress_records = relationship("UserProgress", back_populates="course", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    course_id = Column(BigInteger, ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    is_completed = Column(Boolean, nullable=False, server_default=text("false"))
    score = Column(Integer, nullable=True)

    user = relationship("User", back_populates="progress_records")
    course = relationship("Course", back_populates="progress_records")

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("user_id", "opportunity_id", name="uq_applications_user_opportunity"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(BigInteger, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))

    user = relationship("User", back_populates="applications")
    opportunity = relationship("Opportunity", back_populates="applications")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_type = Column(String(80), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    opportunity_id = Column(BigInteger, ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)
    course_id = Column(BigInteger, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    payload = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"), index=True)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"), index=True)