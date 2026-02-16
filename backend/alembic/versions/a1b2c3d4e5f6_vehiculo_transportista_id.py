"""vehiculo transportista_id

Revision ID: a1b2c3d4e5f6
Revises: 9b3a1d7f0f12
Create Date: 2026-02-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "9b3a1d7f0f12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cat_vehiculos",
        sa.Column("transportista_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_cat_vehiculos_transportista_id",
        "cat_vehiculos",
        "cat_transportistas",
        ["transportista_id"],
        ["id"],
    )
    op.create_index(
        "ix_cat_vehiculos_transportista_id",
        "cat_vehiculos",
        ["transportista_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_cat_vehiculos_transportista_id", table_name="cat_vehiculos")
    op.drop_constraint("fk_cat_vehiculos_transportista_id", "cat_vehiculos", type_="foreignkey")
    op.drop_column("cat_vehiculos", "transportista_id")
