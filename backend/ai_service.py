"""
ai_service.py — Módulo de integración con OpenAI para Train-to-Hire.

Provee funciones de:
  1. Generación de cursos con IA (módulos, temas, quiz)
  2. Tutor IA para estudiantes
  3. Scoring de aplicaciones con IA
"""

import json
import logging
import os
from typing import Optional

from openai import OpenAI

logger = logging.getLogger("traintohire.ai")

# ── Cliente OpenAI ─────────────────────────────────────────────────
_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    """Lazy-init del cliente OpenAI."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY no configurada. "
                "Agrega OPENAI_API_KEY=sk-... en tu archivo .env"
            )
        _client = OpenAI(api_key=api_key)
    return _client


MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# ══════════════════════════════════════════════════════════════════
# 1. GENERACIÓN DE CURSOS
# ══════════════════════════════════════════════════════════════════

def generate_course(
    course_name: str,
    description: str = "",
    requirements: str = "",
    num_modules: int = 3,
    topics_per_module: int = 3,
) -> dict:
    """
    Genera un curso completo usando IA: módulos, temas con URLs de recursos,
    y preguntas de quiz.

    Returns:
        {
            "name": str,
            "description": str,
            "modules": [
                {
                    "title": str,
                    "order": int,
                    "topics": [
                        {"title": str, "content_url": str, "order": int}
                    ]
                }
            ],
            "quiz_questions": [
                {
                    "question": str,
                    "options": [str, str, str, str],
                    "correct_index": int
                }
            ]
        }
    """
    client = _get_client()

    system_prompt = """Eres un experto en diseño instruccional para plataformas de educación y reclutamiento tecnológico.
Tu tarea es crear cursos estructurados y profesionales en español.
SIEMPRE responde en formato JSON válido, sin texto adicional antes o después del JSON."""

    user_prompt = f"""Genera un curso completo con las siguientes especificaciones:

NOMBRE DEL CURSO: {course_name}
{"DESCRIPCIÓN: " + description if description else ""}
{"REQUISITOS DEL PUESTO: " + requirements if requirements else ""}

ESTRUCTURA REQUERIDA:
- {num_modules} módulos
- {topics_per_module} temas por módulo
- 5 preguntas de quiz de opción múltiple

Para cada tema, incluye un content_url que sea un enlace real y relevante a un recurso educativo gratuito
(YouTube, MDN, W3Schools, freeCodeCamp, documentación oficial, etc.).

Responde ÚNICAMENTE con este JSON (sin markdown, sin ```):
{{
  "name": "{course_name}",
  "description": "Descripción detallada del curso en 2-3 oraciones",
  "modules": [
    {{
      "title": "Nombre del módulo",
      "order": 0,
      "topics": [
        {{
          "title": "Nombre del tema",
          "content_url": "https://...",
          "order": 0
        }}
      ]
    }}
  ],
  "quiz_questions": [
    {{
      "question": "Pregunta en español",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct_index": 0
    }}
  ]
}}"""

    logger.info(f"Generando curso con IA: '{course_name}' ({num_modules} módulos, {topics_per_module} temas)")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    logger.info(f"Respuesta IA recibida ({len(raw)} chars)")

    result = json.loads(raw)

    # Validar estructura mínima
    if "modules" not in result or not isinstance(result["modules"], list):
        raise ValueError("La IA no generó módulos válidos.")
    for i, mod in enumerate(result["modules"]):
        mod.setdefault("order", i)
        mod.setdefault("topics", [])
        for j, topic in enumerate(mod["topics"]):
            topic.setdefault("order", j)
            topic.setdefault("content_url", None)

    result.setdefault("quiz_questions", [])
    result.setdefault("description", f"Curso generado por IA: {course_name}")

    return result


# ══════════════════════════════════════════════════════════════════
# 2. TUTOR IA PARA ESTUDIANTES
# ══════════════════════════════════════════════════════════════════

def ask_tutor(
    question: str,
    course_name: str,
    course_modules: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Tutor IA que responde dudas en contexto del curso.

    Args:
        question: Pregunta del estudiante
        course_name: Nombre del curso
        course_modules: Lista de módulos con temas
        conversation_history: Historial previo [{role, content}]

    Returns:
        Respuesta del tutor en texto.
    """
    client = _get_client()

    # Construir contexto del curso
    course_context = f"CURSO: {course_name}\n\nCONTENIDO:\n"
    for mod in course_modules:
        course_context += f"\nMódulo: {mod.get('title', 'Sin título')}\n"
        for topic in mod.get("topics", []):
            course_context += f"  - {topic.get('title', 'Sin título')}"
            if topic.get("content_url"):
                course_context += f" ({topic['content_url']})"
            course_context += "\n"

    system_prompt = f"""Eres un tutor experto y amigable para la plataforma Train-to-Hire.
Tu rol es ayudar al estudiante con dudas sobre su curso de formación.

{course_context}

REGLAS:
- Responde siempre en español
- Sé conciso pero claro (máximo 300 palabras)
- Si la pregunta no está relacionada con el curso, redirígelo amablemente
- Incluye ejemplos prácticos cuando sea posible
- Si el estudiante necesita más profundidad, sugiere explorar los recursos del curso
- Usa formato Markdown para mejor legibilidad"""

    messages = [{"role": "system", "content": system_prompt}]

    # Agregar historial si existe (máximo últimos 10 mensajes)
    if conversation_history:
        messages.extend(conversation_history[-10:])

    messages.append({"role": "user", "content": question})

    logger.info(f"Tutor IA: pregunta sobre '{course_name}' ({len(question)} chars)")

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.6,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content.strip()
    logger.info(f"Tutor IA: respuesta generada ({len(answer)} chars)")
    return answer


# ══════════════════════════════════════════════════════════════════
# 3. SCORING DE APLICACIONES
# ══════════════════════════════════════════════════════════════════

def score_application(
    student_profile: dict,
    student_email: str,
    opportunity_title: str,
    opportunity_description: str,
    opportunity_requirements: str,
    course_completed: bool,
    course_score: int | None,
) -> dict:
    """
    Evalúa la compatibilidad de un estudiante con una oportunidad.

    Returns:
        {
            "score": int (0-100),
            "summary": str,
            "strengths": [str],
            "areas_to_improve": [str],
            "recommendation": str
        }
    """
    client = _get_client()

    student_info = f"""DATOS DEL ESTUDIANTE:
- Email: {student_email}
- Nombre: {student_profile.get('first_name', 'N/A')} {student_profile.get('last_name', '')}
- Perfil: {json.dumps(student_profile, ensure_ascii=False, default=str)}
- Curso completado: {'Sí' if course_completed else 'No'}
- Puntaje del curso: {course_score if course_score is not None else 'N/A'}/100"""

    opp_info = f"""OPORTUNIDAD:
- Título: {opportunity_title}
- Descripción: {opportunity_description}
- Requisitos: {opportunity_requirements or 'No especificados'}"""

    system_prompt = """Eres un sistema de evaluación de candidatos para plataformas de reclutamiento.
Tu tarea es evaluar la compatibilidad entre un estudiante y una oportunidad laboral.
SIEMPRE responde en JSON válido en español, sin texto adicional."""

    user_prompt = f"""{student_info}

{opp_info}

Evalúa la compatibilidad y responde ÚNICAMENTE con este JSON (sin markdown, sin ```):
{{
  "score": <número entre 0 y 100>,
  "summary": "Resumen de 1-2 oraciones sobre la compatibilidad",
  "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "areas_to_improve": ["Área de mejora 1", "Área de mejora 2"],
  "recommendation": "Recomendación final para la empresa sobre este candidato"
}}"""

    logger.info(f"Scoring IA: {student_email} → {opportunity_title}")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    result = json.loads(raw)

    # Validar y limitar score
    result["score"] = max(0, min(100, int(result.get("score", 50))))
    result.setdefault("summary", "Evaluación no disponible")
    result.setdefault("strengths", [])
    result.setdefault("areas_to_improve", [])
    result.setdefault("recommendation", "Sin recomendación")

    logger.info(f"Scoring IA completado: score={result['score']}")
    return result
