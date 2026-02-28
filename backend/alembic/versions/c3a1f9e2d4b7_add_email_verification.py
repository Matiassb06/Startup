"""add email verification columns to users

Revision ID: c3a1f9e2d4b7
Revises: bf4f1ffe446a
Create Date: 2026-02-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c3a1f9e2d4b7'
down_revision: Union[str, None] = 'bf4f1ffe446a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column('users', sa.Column('verification_token', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'email_verified')
