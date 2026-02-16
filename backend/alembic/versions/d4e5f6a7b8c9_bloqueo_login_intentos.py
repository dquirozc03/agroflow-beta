"""bloqueo_login_intentos

Revision ID: d4e5f6a7b8c9
Revises: c8d9e0f1a2b3
Create Date: 2026-02-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("auth_usuarios", sa.Column("intentos_fallidos", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("auth_usuarios", sa.Column("bloqueado", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("auth_usuarios", "bloqueado")
    op.drop_column("auth_usuarios", "intentos_fallidos")
