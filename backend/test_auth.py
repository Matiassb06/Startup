"""
test_auth.py — Tests de autenticación: registro, login, /auth/me, protección JWT.
"""

import pytest
from conftest import _auth_header, _login, _create_user
import models


# ══════════════════════════════════════════════════════════════════
# REGISTRO
# ══════════════════════════════════════════════════════════════════

class TestRegister:
    def test_register_student_ok(self, client):
        resp = client.post("/auth/register", json={
            "email": "nuevo@student.com",
            "password": "abcd1234",
            "role": "student",
            "profile_data": {"nombre": "Nuevo", "apellidos": "User"},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "student"
        assert data["email"] == "nuevo@student.com"
        assert "access_token" in data

    def test_register_company_ok(self, client):
        resp = client.post("/auth/register", json={
            "email": "nueva@empresa.com",
            "password": "abcd1234",
            "role": "company",
            "profile_data": {"razon_social": "ACME"},
        })
        assert resp.status_code == 200
        assert resp.json()["role"] == "company"

    def test_register_duplicate_email(self, client, student_user):
        resp = client.post("/auth/register", json={
            "email": "student@test.com",
            "password": "otraclave",
            "role": "student",
        })
        assert resp.status_code == 409

    def test_register_invalid_email(self, client):
        resp = client.post("/auth/register", json={
            "email": "sindominio",
            "password": "abcd1234",
            "role": "student",
        })
        assert resp.status_code == 422

    def test_register_short_password(self, client):
        resp = client.post("/auth/register", json={
            "email": "ok@email.com",
            "password": "ab",
            "role": "student",
        })
        assert resp.status_code == 422

    def test_register_invalid_role(self, client):
        resp = client.post("/auth/register", json={
            "email": "ok@email.com",
            "password": "abcd1234",
            "role": "superuser",
        })
        assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════

class TestLogin:
    def test_login_ok(self, client, student_user):
        resp = client.post("/auth/login", json={"email": "student@test.com", "password": "pass1234"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "student"
        assert data["user_id"] == student_user.id
        assert "access_token" in data

    def test_login_wrong_password(self, client, student_user):
        resp = client.post("/auth/login", json={"email": "student@test.com", "password": "wrongpass"})
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post("/auth/login", json={"email": "noexiste@test.com", "password": "pass1234"})
        assert resp.status_code == 401

    def test_login_email_case_insensitive(self, client, student_user):
        resp = client.post("/auth/login", json={"email": "STUDENT@TEST.COM", "password": "pass1234"})
        assert resp.status_code == 200


# ══════════════════════════════════════════════════════════════════
# /auth/me
# ══════════════════════════════════════════════════════════════════

class TestAuthMe:
    def test_get_me_ok(self, client, student_token):
        resp = client.get("/auth/me", headers=_auth_header(student_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "student@test.com"
        assert data["role"] == "student"

    def test_get_me_no_token(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_get_me_invalid_token(self, client):
        resp = client.get("/auth/me", headers=_auth_header("garbage.token.here"))
        assert resp.status_code == 401

    def test_update_profile(self, client, student_token):
        resp = client.patch(
            "/auth/me",
            json={"profile_data": {"nombre": "Actualizado", "telefono": "999888777"}},
            headers=_auth_header(student_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["profile_data"]["nombre"] == "Actualizado"
        assert data["profile_data"]["telefono"] == "999888777"
