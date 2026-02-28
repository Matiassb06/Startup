"""
conftest.py — Fixtures compartidas para los tests de Train-to-Hire.

Crea una base de datos SQLite en memoria, monta tablas, provee un TestClient
y helpers para crear usuarios de cada rol.
"""

import os, sys

# ── Parchear variables de entorno ANTES de importar cualquier módulo del proyecto ──
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret-key"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_EXPIRATION_MINUTES"] = "30"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, JSON
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import JSONB

# Importar módulos del proyecto
sys.path.insert(0, os.path.dirname(__file__))
import database
import models
import auth as auth_module

# ── Parchear JSONB → JSON para que SQLite funcione ──────────────
from sqlalchemy.dialects import sqlite
from sqlalchemy import Integer, BigInteger
from sqlalchemy.ext.compiler import compiles

sqlite.base.SQLiteTypeCompiler.visit_JSONB = sqlite.base.SQLiteTypeCompiler.visit_JSON

# SQLite solo auto-incrementa INTEGER, no BIGINT
@compiles(BigInteger, "sqlite")
def _compile_bigint_sqlite(type_, compiler, **kw):
    return "INTEGER"

# ── Motor SQLite en memoria ───────────────────────────────────────
SQLITE_URL = "sqlite://"
engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Habilitar FK en SQLite
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Parchear server_defaults que usan sintaxis PostgreSQL (::jsonb, NOW())
# para que funcionen en SQLite.
def _patch_server_defaults_for_sqlite():
    from sqlalchemy import text as sa_text
    from sqlalchemy.schema import DefaultClause
    for table in database.Base.metadata.tables.values():
        for col in table.columns:
            if col.server_default is not None:
                sd_text = ""
                if hasattr(col.server_default, "arg"):
                    arg = col.server_default.arg
                    sd_text = str(arg.text) if hasattr(arg, "text") else str(arg)
                if "::jsonb" in sd_text:
                    clean = sd_text.replace("::jsonb", "")
                    col.server_default = DefaultClause(sa_text(clean))
                elif sd_text.upper() == "NOW()":
                    col.server_default = DefaultClause(sa_text("(datetime('now'))"))

_patch_server_defaults_for_sqlite()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Fixtures ──────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_database():
    """Crea todas las tablas antes de cada test y las borra después."""
    database.Base.metadata.create_all(bind=engine)
    yield
    database.Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    """Sesión de DB para cada test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    """TestClient de FastAPI con la DB de testing inyectada."""
    from main import app

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[database.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helpers para crear usuarios ──

def _create_user(db, email: str, password: str, role: models.UserRole, profile: dict = None):
    user = models.User(
        email=email,
        password_hash=auth_module.hash_password(password),
        role=role,
        profile_data=profile or {},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login(client, email: str, password: str) -> dict:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def student_user(db):
    return _create_user(db, "student@test.com", "pass1234", models.UserRole.student, {"nombre": "Test", "apellidos": "Student"})


@pytest.fixture()
def company_user(db):
    return _create_user(db, "company@test.com", "pass1234", models.UserRole.company, {"razon_social": "Test Corp", "ruc": "12345678901"})


@pytest.fixture()
def admin_user(db):
    return _create_user(db, "admin@test.com", "pass1234", models.UserRole.admin, {"name": "Admin"})


@pytest.fixture()
def student_token(client, student_user):
    data = _login(client, "student@test.com", "pass1234")
    return data["access_token"]


@pytest.fixture()
def company_token(client, company_user):
    data = _login(client, "company@test.com", "pass1234")
    return data["access_token"]


@pytest.fixture()
def admin_token(client, admin_user):
    data = _login(client, "admin@test.com", "pass1234")
    return data["access_token"]
