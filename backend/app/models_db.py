from sqlalchemy import Column, String, Integer, Numeric, Date, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid


class ComisionAfp(Base):
    __tablename__ = "comisiones_afp"

    afp            = Column(String, primary_key=True)
    comision       = Column(Numeric(5, 4), nullable=False)
    actualizado_en = Column(Date, nullable=False)


class CuotaHistorica(Base):
    __tablename__ = "cuotas_historicas"

    fecha       = Column(Date, primary_key=True)
    afp         = Column(String, primary_key=True)
    fondo       = Column(String(1), primary_key=True)
    valor_cuota = Column(Numeric(12, 4), nullable=False)

    __table_args__ = (
        Index("idx_cuotas_afp_fondo_fecha", "afp", "fondo", "fecha"),
    )


class Simulacion(Base):
    __tablename__ = "simulaciones"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edad            = Column(Integer, nullable=False)
    sueldo          = Column(Integer, nullable=False)
    afp             = Column(String, nullable=False)
    fondo           = Column(String(1), nullable=False)
    saldo_estimado  = Column(Integer, nullable=False)
    pension_mensual = Column(Integer, nullable=False)