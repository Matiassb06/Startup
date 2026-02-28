"""agregar_status_rejected_y_rejection_reason

Revision ID: fc41edf71bd4
Revises: c7d3f1a2b4e6
Create Date: 2026-02-28 18:51:21.002732

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc41edf71bd4'
down_revision: Union[str, Sequence[str], None] = 'c7d3f1a2b4e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Agregar valor 'rejected' al enum opportunity_status
    op.execute("ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'rejected'")
    # Agregar columna rejection_reason
    op.add_column('opportunities', sa.Column('rejection_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('opportunities', 'rejection_reason')
    # No se puede remover un valor de enum en PostgreSQL fácilmente
