"""
test_student.py — Tests del flujo de estudiante:
  oportunidades, completar curso, aplicar, historial.
"""

import pytest
from conftest import _auth_header, _create_user
import models


def _seed_published_opportunity(db, company_user, with_course=False):
    """Helper: crea una oportunidad publicada y opcionalmente un curso."""
    opp = models.Opportunity(
        title="Dev Python Jr",
        description="Posición junior de desarrollo Python para startup.",
        requirements="Python 3, git",
        company_id=company_user.id,
        status=models.OpportunityStatus.published,
    )
    db.add(opp)
    db.commit()
    db.refresh(opp)

    course = None
    if with_course:
        course = models.Course(
            opportunity_id=opp.id,
            content_url="https://learn.example.com/python-jr",
            quiz_data={"questions": 10},
        )
        db.add(course)
        db.commit()
        db.refresh(course)

    return opp, course


class TestStudentOpportunities:
    def test_list_opportunities_ok(self, client, student_token, db, company_user):
        _seed_published_opportunity(db, company_user)
        resp = client.get("/student/opportunities", headers=_auth_header(student_token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["title"] == "Dev Python Jr"

    def test_list_opportunities_requires_student_role(self, client, company_token):
        resp = client.get("/student/opportunities", headers=_auth_header(company_token))
        assert resp.status_code == 403

    def test_list_opportunities_no_auth(self, client):
        resp = client.get("/student/opportunities")
        assert resp.status_code == 401


class TestCompleteCourse:
    def test_complete_course_ok(self, client, student_token, db, company_user):
        opp, course = _seed_published_opportunity(db, company_user, with_course=True)
        resp = client.post(
            f"/student/courses/{course.id}/complete",
            json={"score": 85},
            headers=_auth_header(student_token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_completed"] is True
        assert data["score"] == 85

    def test_complete_course_not_found(self, client, student_token):
        resp = client.post(
            "/student/courses/99999/complete",
            json={"score": 50},
            headers=_auth_header(student_token),
        )
        assert resp.status_code == 404

    def test_complete_course_idempotent(self, client, student_token, db, company_user):
        opp, course = _seed_published_opportunity(db, company_user, with_course=True)
        client.post(f"/student/courses/{course.id}/complete", json={"score": 70}, headers=_auth_header(student_token))
        resp = client.post(f"/student/courses/{course.id}/complete", json={"score": 90}, headers=_auth_header(student_token))
        assert resp.status_code == 200
        assert resp.json()["score"] == 90


class TestApply:
    def test_apply_no_course_ok(self, client, student_token, db, company_user):
        opp, _ = _seed_published_opportunity(db, company_user, with_course=False)
        resp = client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        assert resp.status_code == 200
        assert resp.json()["already_applied"] is False

    def test_apply_with_completed_course(self, client, student_token, db, company_user, student_user):
        opp, course = _seed_published_opportunity(db, company_user, with_course=True)
        # Completar curso primero
        client.post(f"/student/courses/{course.id}/complete", json={"score": 80}, headers=_auth_header(student_token))
        # Luego aplicar
        resp = client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        assert resp.status_code == 200
        assert resp.json()["already_applied"] is False

    def test_apply_blocked_without_course(self, client, student_token, db, company_user):
        opp, course = _seed_published_opportunity(db, company_user, with_course=True)
        # No completamos el curso → bloqueado
        resp = client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        assert resp.status_code == 403

    def test_apply_duplicate(self, client, student_token, db, company_user):
        opp, _ = _seed_published_opportunity(db, company_user, with_course=False)
        client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        resp = client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        assert resp.status_code == 200
        assert resp.json()["already_applied"] is True

    def test_apply_not_found(self, client, student_token):
        resp = client.post("/student/apply", json={"opportunity_id": 99999}, headers=_auth_header(student_token))
        assert resp.status_code == 404


class TestStudentApplications:
    def test_applications_history(self, client, student_token, db, company_user):
        opp, _ = _seed_published_opportunity(db, company_user, with_course=False)
        client.post("/student/apply", json={"opportunity_id": opp.id}, headers=_auth_header(student_token))
        resp = client.get("/student/applications", headers=_auth_header(student_token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["opportunity_title"] == "Dev Python Jr"
