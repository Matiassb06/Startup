"""course_modules_topics

Revision ID: c7d3f1a2b4e6
Revises: a8abadd0e562
Create Date: 2026-02-28 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d3f1a2b4e6'
down_revision: Union[str, Sequence[str], None] = 'a8abadd0e562'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear tabla course_modules
    op.create_table(
        'course_modules',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('course_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('order', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_course_modules_course_id'), 'course_modules', ['course_id'], unique=False)

    # Crear tabla course_topics
    op.create_table(
        'course_topics',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('module_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content_url', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.ForeignKeyConstraint(['module_id'], ['course_modules.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_course_topics_module_id'), 'course_topics', ['module_id'], unique=False)

    # Migrar datos existentes: por cada curso que tenga content_url,
    # crear un módulo + tema con esa URL antes de borrar la columna
    op.execute("""
        INSERT INTO course_modules (course_id, title, "order")
        SELECT id, 'Módulo 1', 0
        FROM courses
        WHERE content_url IS NOT NULL AND content_url != ''
    """)
    op.execute("""
        INSERT INTO course_topics (module_id, title, content_url, "order")
        SELECT cm.id, 'Contenido principal', c.content_url, 0
        FROM course_modules cm
        JOIN courses c ON c.id = cm.course_id
        WHERE c.content_url IS NOT NULL AND c.content_url != ''
    """)

    # Eliminar columna content_url de courses
    op.drop_column('courses', 'content_url')


def downgrade() -> None:
    # Recrear la columna content_url
    op.add_column('courses', sa.Column('content_url', sa.Text(), nullable=True))

    # Restaurar datos: tomar la URL del primer tema del primer módulo
    op.execute("""
        UPDATE courses SET content_url = (
            SELECT ct.content_url
            FROM course_modules cm
            JOIN course_topics ct ON ct.module_id = cm.id
            WHERE cm.course_id = courses.id
            ORDER BY cm."order", ct."order"
            LIMIT 1
        )
    """)

    # Poner default a los que no tienen
    op.execute("UPDATE courses SET content_url = '' WHERE content_url IS NULL")
    op.alter_column('courses', 'content_url', nullable=False)

    op.drop_index(op.f('ix_course_topics_module_id'), table_name='course_topics')
    op.drop_table('course_topics')
    op.drop_index(op.f('ix_course_modules_course_id'), table_name='course_modules')
    op.drop_table('course_modules')
