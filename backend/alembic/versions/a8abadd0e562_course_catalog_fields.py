"""course_catalog_fields

Revision ID: a8abadd0e562
Revises: 648cb7b81507
Create Date: 2026-02-28 15:50:24.312556

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8abadd0e562'
down_revision: Union[str, Sequence[str], None] = '648cb7b81507'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('courses', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False))
    op.alter_column('courses', 'opportunity_id',
               existing_type=sa.BIGINT(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('courses', 'opportunity_id',
               existing_type=sa.BIGINT(),
               nullable=False)
    op.drop_column('courses', 'is_active')
    op.drop_column('courses', 'description')
