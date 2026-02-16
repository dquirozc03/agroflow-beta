"""estados y auditoria registros

Revision ID: 9b3a1d7f0f12
Revises: 55ff5ba37e8d
Create Date: 2026-02-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "9b3a1d7f0f12"
down_revision = "55ff5ba37e8d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nuevos campos de estado
    op.add_column("ope_registros", sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("ope_registros", sa.Column("anulado_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("ope_registros", sa.Column("anulado_motivo", sa.String(length=250), nullable=True))

    # Normalizar estado viejo: borrador -> pendiente
    op.execute(
        "UPDATE ope_registros SET estado='pendiente' "
        "WHERE estado IS NULL OR estado IN ('borrador')"
    )

    # Default DB (server_default) para nuevos inserts
    op.alter_column("ope_registros", "estado", server_default=sa.text("'pendiente'"))

    # Constraint de estados válidos
    op.create_check_constraint(
        "ck_ope_registros_estado",
        "ope_registros",
        "estado IN ('pendiente','procesado','anulado','cerrado')",
    )

    # Índice útil para filtros
    op.create_index("ix_ope_registros_estado", "ope_registros", ["estado"])

    # Tabla auditoría
    op.create_table(
        "ope_registro_eventos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "registro_id",
            sa.Integer(),
            sa.ForeignKey("ope_registros.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("accion", sa.String(length=30), nullable=False),
        sa.Column("antes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("despues", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("motivo", sa.String(length=250), nullable=True),
        sa.Column("usuario", sa.String(length=80), nullable=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_index(
        "ix_ope_registro_eventos_registro_id",
        "ope_registro_eventos",
        ["registro_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_ope_registro_eventos_registro_id", table_name="ope_registro_eventos")
    op.drop_table("ope_registro_eventos")

    op.drop_index("ix_ope_registros_estado", table_name="ope_registros")
    op.drop_constraint("ck_ope_registros_estado", "ope_registros", type_="check")

    # Volvemos default a 'borrador' (como estaba originalmente)
    op.alter_column("ope_registros", "estado", server_default=sa.text("'borrador'"))

    op.drop_column("ope_registros", "anulado_motivo")
    op.drop_column("ope_registros", "anulado_at")
    op.drop_column("ope_registros", "processed_at")
