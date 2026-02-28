"""add_name_column_to_courses

Revision ID: 648cb7b81507
Revises: c3a1f9e2d4b7
Create Date: 2026-02-28 15:35:12.594872

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '648cb7b81507'
down_revision: Union[str, Sequence[str], None] = 'c3a1f9e2d4b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('name', sa.String(length=255), server_default=sa.text("'Curso obligatorio'"), nullable=False))


def downgrade() -> None:
    op.drop_column('courses', 'name')
