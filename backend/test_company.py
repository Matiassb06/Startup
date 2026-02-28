"""
test_company.py — Tests del flujo de empresa:
  crear oportunidad, listar, ver postulantes, estadísticas.
"""

import pytest
from conftest import _auth_header, _create_user
import models


def _create_opportunity_via_api(client, company_token):
    return client.post(
        "/company/opportunities",
        json={"title": "Data Engineer", "description": "Posición de ingeniería de datos para fintech.", "requirements": "SQL, Python"},
        headers=_auth_header(company_token),
    )


class TestCompanyOpportunities:
    def test_create_opportunity(self, client, company_token):
        resp = _create_opportunity_via_api(client, company_token)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Data Engineer"
        assert data["status"] == "pending_review"

    def test_create_opportunity_requires_company_role(self, client, student_token):
        resp = client.post(
            "/company/opportunities",
            json={"title": "Hacker", "description": "Esto no debería funcionar para students."},
            headers=_auth_header(student_token),
        )
        assert resp.status_code == 403

    def test_list_my_opportunities(self, client, company_token):
        _create_opportunity_via_api(client, company_token)
        _create_opportunity_via_api(client, company_token)
        resp = client.get("/company/opportunities", headers=_auth_header(company_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_list_only_own_opportunities(self, client, company_token, db):
        """Empresa A no ve oportunidades de empresa B."""
        _create_opportunity_via_api(client, company_token)
        # Crear segunda empresa
        other = _create_user(db, "other@company.com", "pass1234", models.UserRole.company)
        resp_login = client.post("/auth/login", json={"email": "other@company.com", "password": "pass1234"})
        other_token = resp_login.json()["access_token"]
        resp = client.get("/company/opportunities", headers=_auth_header(other_token))
        assert resp.status_code == 200
        assert len(resp.json()) == 0  # No ve las de la otra empresa


class TestCompanyApplicants:
    def test_view_applicants(self, client, company_token, student_token, db, company_user):
        # Crear oportunidad y publicarla directamente
        opp = models.Opportunity(
            title="Frontend Dev", description="React developer needed.",
            company_id=company_user.id, status=models.OpportunityStatus.published,
        )
        db.add(opp)
        db.commit()
        db.refresh(opp)

        # Estudiante aplica
        client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))

        # Empresa ve postulantes
        resp = client.get(f"/company/opportunities/{opp.id}/applicants", headers=_auth_header(company_token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["email"] == "student@test.com"

    def test_view_applicants_not_owner(self, client, db, company_user, student_token):
        """Empresa B no puede ver postulantes de empresa A."""
        opp = models.Opportunity(
            title="Backend", description="Go developer needed.",
            company_id=company_user.id, status=models.OpportunityStatus.published,
        )
        db.add(opp)
        db.commit()
        db.refresh(opp)

        other = _create_user(db, "otro@company.com", "pass1234", models.UserRole.company)
        resp_login = client.post("/auth/login", json={"email": "otro@company.com", "password": "pass1234"})
        other_token = resp_login.json()["access_token"]

        resp = client.get(f"/company/opportunities/{opp.id}/applicants", headers=_auth_header(other_token))
        assert resp.status_code == 404


class TestCompanyStats:
    def test_stats_ok(self, client, company_token):
        _create_opportunity_via_api(client, company_token)
        resp = client.get("/company/stats", headers=_auth_header(company_token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_opportunities"] >= 1
        assert "published" in data
        assert "total_applicants" in data
