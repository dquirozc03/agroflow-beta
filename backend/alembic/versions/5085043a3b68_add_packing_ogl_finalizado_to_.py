"""add packing_ogl_finalizado to RefPosicionamiento

Revision ID: 5085043a3b68
Revises: 8587eb16d195
Create Date: 2026-03-22 18:21:20.007944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5085043a3b68'
down_revision: Union[str, Sequence[str], None] = '8587eb16d195'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ref_posicionamiento', sa.Column('packing_ogl_finalizado', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('packing_confirmaciones', sa.Column('archivo_nombre', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('packing_confirmaciones', 'archivo_nombre')
    op.drop_column('ref_posicionamiento', 'packing_ogl_finalizado')
