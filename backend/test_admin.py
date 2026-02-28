"""
test_admin.py — Tests del flujo de administrador:
  publicar, asignar curso, métricas, gestión de usuarios.
"""

import pytest
from conftest import _auth_header, _create_user
import models


def _seed_pending_opportunity(db, company_user):
    opp = models.Opportunity(
        title="QA Analyst", description="Quality assurance analyst for SaaS platform.",
        company_id=company_user.id, status=models.OpportunityStatus.pending_review,
    )
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


def _seed_catalog_course(db):
    """Helper: crea un curso de catálogo (sin oportunidad) para usar al publicar."""
    course = models.Course(
        name="Curso QA Básico",
        content_url="https://learn.example.com/qa-basics",
        opportunity_id=None,
        is_active=True,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


class TestAdminPending:
    def test_list_pending(self, client, admin_token, db, company_user):
        _seed_pending_opportunity(db, company_user)
        resp = client.get("/admin/opportunities/pending", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(o["status"] == "pending_review" for o in data)

    def test_list_pending_requires_admin(self, client, student_token):
        resp = client.get("/admin/opportunities/pending", headers=_auth_header(student_token))
        assert resp.status_code == 403


class TestAdminPublish:
    def test_publish_ok(self, client, admin_token, db, company_user):
        opp = _seed_pending_opportunity(db, company_user)
        cat = _seed_catalog_course(db)
        resp = client.patch(
            f"/admin/opportunities/{opp.id}/publish",
            json={"catalog_course_id": cat.id},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    def test_publish_idempotent(self, client, admin_token, db, company_user):
        opp = _seed_pending_opportunity(db, company_user)
        cat = _seed_catalog_course(db)
        client.patch(
            f"/admin/opportunities/{opp.id}/publish",
            json={"catalog_course_id": cat.id},
            headers=_auth_header(admin_token),
        )
        resp = client.patch(
            f"/admin/opportunities/{opp.id}/publish",
            json={"catalog_course_id": cat.id},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 200

    def test_publish_not_found(self, client, admin_token, db):
        cat = _seed_catalog_course(db)
        resp = client.patch(
            "/admin/opportunities/99999/publish",
            json={"catalog_course_id": cat.id},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 404


class TestAdminCourse:
    def test_upsert_course_create(self, client, admin_token, db, company_user):
        opp = _seed_pending_opportunity(db, company_user)
        resp = client.patch(
            f"/admin/opportunities/{opp.id}/course",
            json={"name": "Curso QA", "content_url": "https://learn.example.com/qa", "quiz_data": {"q": 5}},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["content_url"] == "https://learn.example.com/qa"

    def test_upsert_course_update(self, client, admin_token, db, company_user):
        opp = _seed_pending_opportunity(db, company_user)
        client.patch(
            f"/admin/opportunities/{opp.id}/course",
            json={"name": "Curso v1", "content_url": "https://v1.com", "quiz_data": {}},
            headers=_auth_header(admin_token),
        )
        resp = client.patch(
            f"/admin/opportunities/{opp.id}/course",
            json={"name": "Curso v2", "content_url": "https://v2.com", "quiz_data": {"updated": True}},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["content_url"] == "https://v2.com"

    def test_upsert_course_invalid_url(self, client, admin_token, db, company_user):
        opp = _seed_pending_opportunity(db, company_user)
        resp = client.patch(
            f"/admin/opportunities/{opp.id}/course",
            json={"content_url": "not-a-url", "quiz_data": {}},
            headers=_auth_header(admin_token),
        )
        assert resp.status_code == 422


class TestAdminMetrics:
    def test_metrics_summary_ok(self, client, admin_token):
        resp = client.get("/admin/metrics/summary", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "total_students" in data
        assert "unlock_rate_percent" in data

    def test_metrics_with_window(self, client, admin_token):
        resp = client.get("/admin/metrics/summary?window_days=7", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        assert resp.json()["window_days"] == 7

    def test_metrics_requires_admin(self, client, company_token):
        resp = client.get("/admin/metrics/summary", headers=_auth_header(company_token))
        assert resp.status_code == 403


class TestAdminUsers:
    def test_list_all_users(self, client, admin_token, student_user, company_user):
        resp = client.get("/admin/users", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data
        emails = [u["email"] for u in data["items"]]
        assert "student@test.com" in emails
        assert "company@test.com" in emails

    def test_filter_users_by_role(self, client, admin_token, student_user, company_user):
        resp = client.get("/admin/users?role=student", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert all(u["role"] == "student" for u in data["items"])

    def test_list_all_opportunities(self, client, admin_token, db, company_user):
        _seed_pending_opportunity(db, company_user)
        resp = client.get("/admin/opportunities/all", headers=_auth_header(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) >= 1


class TestPublicEndpoints:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["version"] == "2.0.0"

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_public_opportunities(self, client, db, company_user):
        opp = models.Opportunity(
            title="Public", description="Visible publicada.",
            company_id=company_user.id, status=models.OpportunityStatus.published,
        )
        db.add(opp)
        db.commit()
        resp = client.get("/opportunities/")
        assert resp.status_code == 200
        data = resp.json()
        assert any(o["title"] == "Public" for o in data["items"])

    def test_contact(self, client):
        resp = client.post("/contact/", json={
            "name": "María", "email": "maria@test.com",
            "subject": "Consulta", "message": "Tengo una consulta sobre la plataforma.",
        })
        assert resp.status_code == 200
        assert "Mensaje recibido" in resp.json()["message"]
