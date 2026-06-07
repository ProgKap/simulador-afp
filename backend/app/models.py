from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal

AFP_VALIDAS = {"uno", "modelo", "planvital", "habitat", "capital", "cuprum", "provida"}
FONDOS_VALIDOS = {"A", "B", "C", "D", "E"}
EDAD_JUBILACION = {"hombre": 65, "mujer": 60}


class SimulacionInput(BaseModel):
    edad: int = Field(..., ge=18, le=64)
    sexo: Literal["hombre", "mujer"] = "hombre"
    sueldo: int = Field(..., ge=460_000, le=100_000_000)
    afp: str
    fondo: str
    saldo_actual: int = Field(default=0, ge=0)
    crecimiento_sueldo: float = Field(default=0.02, ge=0.0, le=0.15)
    apv_mensual: int = Field(default=0, ge=0, le=5_000_000)

    @model_validator(mode="after")
    def validar_edad_segun_sexo(self) -> "SimulacionInput":
        edad_max = EDAD_JUBILACION[self.sexo] - 1
        if self.edad > edad_max:
            raise ValueError(
                f"Para {'mujeres' if self.sexo == 'mujer' else 'hombres'} "
                f"la edad máxima es {edad_max} años"
            )
        return self

    @field_validator("afp")
    @classmethod
    def validar_afp(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in AFP_VALIDAS:
            raise ValueError(f"AFP inválida. Opciones: {AFP_VALIDAS}")
        return v

    @field_validator("fondo")
    @classmethod
    def validar_fondo(cls, v: str) -> str:
        v = v.upper().strip()
        if v not in FONDOS_VALIDOS:
            raise ValueError(f"Fondo inválido. Opciones: {FONDOS_VALIDOS}")
        return v


class ComparadorInput(BaseModel):
    edad: int = Field(..., ge=18, le=64)
    sexo: Literal["hombre", "mujer"] = "hombre"
    sueldo: int = Field(..., ge=460_000, le=100_000_000)
    fondo: str
    saldo_actual: int = Field(default=0, ge=0)
    crecimiento_sueldo: float = Field(default=0.02, ge=0.0, le=0.15)
    apv_mensual: int = Field(default=0, ge=0, le=5_000_000)

    @model_validator(mode="after")
    def validar_edad_segun_sexo(self) -> "ComparadorInput":
        edad_max = EDAD_JUBILACION[self.sexo] - 1
        if self.edad > edad_max:
            raise ValueError(
                f"Para {'mujeres' if self.sexo == 'mujer' else 'hombres'} "
                f"la edad máxima es {edad_max} años"
            )
        return self

    @field_validator("fondo")
    @classmethod
    def validar_fondo(cls, v: str) -> str:
        v = v.upper().strip()
        if v not in FONDOS_VALIDOS:
            raise ValueError(f"Fondo inválido. Opciones: {FONDOS_VALIDOS}")
        return v


class PercentilesSaldo(BaseModel):
    p10: int
    p25: int
    p50: int
    p75: int
    p90: int


class SimulacionOutput(BaseModel):
    saldo_estimado:        int
    pension_mensual:       int
    pension_efectiva:      int
    pension_pesimista:     int
    pension_optimista:     int
    pension_p10:           int
    pension_p25:           int
    pension_p75:           int
    pension_p90:           int
    anos_hasta_jubilacion: int
    edad_jubilacion:       int
    comision_afp:          float
    total_comisiones:      int
    total_cotizacion:      int
    total_apv:             int
    pgu_elegible:          bool
    pgu_monto:             int
    proyeccion_anual:      list[dict]
    percentiles_saldo:     dict


class ComparadorRow(BaseModel):
    afp:                  str
    label:                str
    comision_pct:         float
    pension_mensual:      int
    pension_efectiva:     int
    total_comisiones:     int
    saldo_estimado:       int
    pgu_elegible:         bool
    sobrecosto_vs_minima: int


class ComparadorOutput(BaseModel):
    filas: list[ComparadorRow]
