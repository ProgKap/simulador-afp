import numpy as np
import polars as pl

from app.bcch_client import get_utm_valor

COMISIONES: dict[str, float] = {
    "uno":       0.0046,
    "modelo":    0.0058,
    "planvital": 0.0116,
    "habitat":   0.0127,
    "capital":   0.0144,
    "cuprum":    0.0144,
    "provida":   0.0145,
}

AFP_LABELS: dict[str, str] = {
    "uno":       "AFP Uno",
    "modelo":    "AFP Modelo",
    "planvital": "AFP PlanVital",
    "habitat":   "AFP Hábitat",
    "capital":   "AFP Capital",
    "cuprum":    "AFP Cuprum",
    "provida":   "AFP ProVida",
}

RENTABILIDAD_HISTORICA: dict[str, float] = {
    "A": 0.072,
    "B": 0.058,
    "C": 0.045,
    "D": 0.031,
    "E": 0.023,
}

# Volatilidad anualizada histórica por fondo (fuente: SP Chile, serie 2002-2024)
VOLATILIDAD: dict[str, float] = {
    "A": 0.115,
    "B": 0.085,
    "C": 0.055,
    "D": 0.035,
    "E": 0.015,
}

# Edad legal de jubilación (DL 3.500, Ley 15.386)
EDAD_JUBILACION: dict[str, int] = {"hombre": 65, "mujer": 60}

# Esperanza de vida post-jubilación según tablas RV-2014 (CMF Chile)
# Hombre jubila 65 → ~20 años hasta ~85
# Mujer jubila 60  → ~27 años hasta ~87 (mayor longevidad femenina)
ESPERANZA_VIDA_POST_JUBILACION: dict[str, int] = {"hombre": 20, "mujer": 27}

# Pensión Garantizada Universal (PGU) — vigente 2024, CLP/mes
PGU_MONTO = 214_296

# El 10% de la remuneración imponible va íntegro a la cuenta individual
# La comisión AFP se cobra APARTE, no reduce el saldo acumulado
COTIZACION_OBLIGATORIA = 0.10

# APV Tipo A: el Estado bonifica el 15% de los aportes, con un tope de 6 UTM/año.
# La bonificación máxima es 6 UTM (≈$410.000 con UTM vigente), NO el aporte máximo.
# Aporte máximo para recibir bonificación completa = 6 UTM / 15% = 40 UTM/año.
APV_BONIFICACION_RATE = 0.15
APV_BONIFICACION_UTM = 6  # tope bonificación en UTM/año


def _apvEfectivoMensual(apv_mensual: int) -> float:
    """
    Retorna el aporte mensual efectivo al incluir la bonificación fiscal Tipo A.
    El Estado deposita 15% de los aportes, con un tope de 6 UTM/año.
    """
    if apv_mensual <= 0:
        return 0.0
    utm = get_utm_valor()
    tope_bonificacion_anual = APV_BONIFICACION_UTM * utm
    apv_anual = apv_mensual * 12
    bonificacion = min(apv_anual * APV_BONIFICACION_RATE, tope_bonificacion_anual)
    return apv_mensual + bonificacion / 12


def _buildFlujos(
    sueldo: int,
    crecimiento_sueldo: float,
    comision: float,
    apv_mensual: int,
    anos: int,
) -> tuple[list[float], list[float], list[float]]:
    """
    Retorna tres listas de flujos anuales:
    - cotizaciones_cuenta: 10% que va a la cuenta individual
    - costos_comision: % de comisión que le pagas a la AFP
    - aportes_apv: APV efectivo (con bonificación fiscal Tipo A)
    """
    cotizaciones, comisiones, apv_list = [], [], []
    apv_efectivo_anual = _apvEfectivoMensual(apv_mensual) * 12
    for ano in range(anos):
        s = sueldo * (1 + crecimiento_sueldo) ** ano
        cotizaciones.append(s * COTIZACION_OBLIGATORIA * 12)
        comisiones.append(s * comision * 12)
        apv_list.append(apv_efectivo_anual)
    return cotizaciones, comisiones, apv_list


def _monteCarlo(
    saldo_inicial: float,
    cotizaciones: list[float],
    apv_list: list[float],
    rentabilidad: float,
    volatilidad: float,
    n: int = 2000,
) -> dict:
    """
    Monte Carlo vectorizado con numpy.
    Retorna percentiles finales Y bandas anuales p25/p75 para el gráfico.
    """
    anos = len(cotizaciones)
    flujo = np.array(cotizaciones) + np.array(apv_list)
    # shape (n, anos): retornos aleatorios normales
    retornos = np.random.default_rng().normal(rentabilidad, volatilidad, (n, anos))

    saldos = np.full(n, saldo_inicial)
    bandas_p25: list[int] = []
    bandas_p75: list[int] = []

    for i in range(anos):
        saldos = (saldos + flujo[i]) * (1.0 + retornos[:, i])
        bandas_p25.append(int(np.percentile(saldos, 25)))
        bandas_p75.append(int(np.percentile(saldos, 75)))

    p10, p25, p50, p75, p90 = np.percentile(saldos, [10, 25, 50, 75, 90])
    return {
        "p10": int(p10),
        "p25": int(p25),
        "p50": int(p50),
        "p75": int(p75),
        "p90": int(p90),
        "bandas_p25": bandas_p25,
        "bandas_p75": bandas_p75,
    }


def calcularProyeccionAnual(
    edad: int,
    sueldo: int,
    afp: str,
    fondo: str,
    saldo_actual: int = 0,
    crecimiento_sueldo: float = 0.02,
    sexo: str = "hombre",
    apv_mensual: int = 0,
    bandas_p25: list[int] | None = None,
    bandas_p75: list[int] | None = None,
) -> list[dict]:
    comision = COMISIONES[afp]
    rentabilidad = RENTABILIDAD_HISTORICA[fondo]
    edad_jubilacion = EDAD_JUBILACION[sexo]
    anos = edad_jubilacion - edad

    cotizaciones, costos_comision, apv_list = _buildFlujos(
        sueldo, crecimiento_sueldo, comision, apv_mensual, anos
    )

    # Saldo determinístico año a año
    saldo = float(saldo_actual)
    saldos: list[int] = []
    for i in range(anos):
        saldo = (saldo + cotizaciones[i] + apv_list[i]) * (1.0 + rentabilidad)
        saldos.append(int(saldo))

    df = pl.DataFrame({
        "ano":                  list(range(edad + 1, edad_jubilacion + 1)),
        "saldo":                saldos,
        "cotizacion_anual":     [int(c) for c in cotizaciones],
        "costo_comision_anual": [int(c) for c in costos_comision],
        "apv_anual":            [int(c) for c in apv_list],
        "saldo_p25":            bandas_p25 if bandas_p25 else [0] * anos,
        "saldo_p75":            bandas_p75 if bandas_p75 else [0] * anos,
    })
    return df.to_dicts()


def calcularSimulacion(
    edad: int,
    sueldo: int,
    afp: str,
    fondo: str,
    saldo_actual: int = 0,
    crecimiento_sueldo: float = 0.02,
    sexo: str = "hombre",
    apv_mensual: int = 0,
) -> dict:
    comision = COMISIONES[afp]
    rentabilidad = RENTABILIDAD_HISTORICA[fondo]
    volatilidad = VOLATILIDAD[fondo]
    edad_jubilacion = EDAD_JUBILACION[sexo]
    anos = edad_jubilacion - edad
    meses_retiro = ESPERANZA_VIDA_POST_JUBILACION[sexo] * 12

    cotizaciones, costos_comision, apv_list = _buildFlujos(
        sueldo, crecimiento_sueldo, comision, apv_mensual, anos
    )

    mc = _monteCarlo(float(saldo_actual), cotizaciones, apv_list, rentabilidad, volatilidad)

    proyeccion = calcularProyeccionAnual(
        edad, sueldo, afp, fondo, saldo_actual, crecimiento_sueldo, sexo, apv_mensual,
        bandas_p25=mc["bandas_p25"],
        bandas_p75=mc["bandas_p75"],
    )

    saldo_final = proyeccion[-1]["saldo"] if proyeccion else 0
    pension = saldo_final // meses_retiro

    pension_p10 = mc["p10"] // meses_retiro
    pension_p25 = mc["p25"] // meses_retiro
    pension_p75 = mc["p75"] // meses_retiro
    pension_p90 = mc["p90"] // meses_retiro

    total_comisiones = int(sum(costos_comision))
    total_cotizacion = int(sum(cotizaciones))
    total_apv = int(sum(apv_list))

    pgu_elegible = pension < PGU_MONTO
    pension_efectiva = PGU_MONTO if pgu_elegible else pension

    return {
        "saldo_estimado":        saldo_final,
        "pension_mensual":       pension,
        "pension_efectiva":      pension_efectiva,
        "pension_pesimista":     pension_p25,
        "pension_optimista":     pension_p75,
        "pension_p10":           pension_p10,
        "pension_p25":           pension_p25,
        "pension_p75":           pension_p75,
        "pension_p90":           pension_p90,
        "anos_hasta_jubilacion": anos,
        "edad_jubilacion":       edad_jubilacion,
        "comision_afp":          comision,
        "total_comisiones":      total_comisiones,
        "total_cotizacion":      total_cotizacion,
        "total_apv":             total_apv,
        "pgu_elegible":          pgu_elegible,
        "pgu_monto":             PGU_MONTO,
        "proyeccion_anual":      proyeccion,
        "percentiles_saldo":     {
            "p10": mc["p10"], "p25": mc["p25"], "p50": mc["p50"],
            "p75": mc["p75"], "p90": mc["p90"],
        },
    }


def compararAFPs(
    edad: int,
    sueldo: int,
    fondo: str,
    saldo_actual: int = 0,
    crecimiento_sueldo: float = 0.02,
    sexo: str = "hombre",
    apv_mensual: int = 0,
) -> list[dict]:
    """
    Compara las 7 AFPs para el mismo perfil.
    Usa polars para construir, ordenar y calcular el sobrecosto vs la más barata.
    Nota: la pensión base es igual para todas (mismo 10%); el diferenciador
    es el total de comisiones pagadas a lo largo de la vida laboral.
    """
    filas = []
    for afp_nombre in COMISIONES:
        comision = COMISIONES[afp_nombre]
        anos = EDAD_JUBILACION[sexo] - edad
        _, costos_comision, _ = _buildFlujos(
            sueldo, crecimiento_sueldo, comision, apv_mensual, anos
        )
        meses_retiro = ESPERANZA_VIDA_POST_JUBILACION[sexo] * 12

        # Deterministic saldo (same for all AFPs, commission doesn't reduce account)
        cotizaciones, _, apv_list = _buildFlujos(
            sueldo, crecimiento_sueldo, comision, apv_mensual, anos
        )
        saldo = float(saldo_actual)
        for i in range(anos):
            saldo = (saldo + cotizaciones[i] + apv_list[i]) * (1.0 + RENTABILIDAD_HISTORICA[fondo])

        total_comisiones = int(sum(costos_comision))
        pension_mensual = int(saldo) // meses_retiro
        pgu_elegible = pension_mensual < PGU_MONTO

        filas.append({
            "afp":              afp_nombre,
            "label":            AFP_LABELS[afp_nombre],
            "comision_pct":     comision,
            "pension_mensual":  pension_mensual,
            "pension_efectiva": PGU_MONTO if pgu_elegible else pension_mensual,
            "total_comisiones": total_comisiones,
            "saldo_estimado":   int(saldo),
            "pgu_elegible":     pgu_elegible,
        })

    df = (
        pl.DataFrame(filas)
        .sort("total_comisiones")
        .with_columns(
            (pl.col("total_comisiones") - pl.col("total_comisiones").min())
            .alias("sobrecosto_vs_minima")
        )
    )
    return df.to_dicts()
