"""auth_usuarios

Revision ID: c8d9e0f1a2b3
Revises: a1b2c3d4e5f6
Create Date: 2026-02-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auth_usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario", sa.String(80), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("rol", sa.String(50), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("actualizado_en", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_usuarios_usuario", "auth_usuarios", ["usuario"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_auth_usuarios_usuario", table_name="auth_usuarios")
    op.drop_table("auth_usuarios")
