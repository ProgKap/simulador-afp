import pytest
from app.simulator import calcularSimulacion, calcularProyeccionAnual, compararAFPs
from app.models import SimulacionInput
from app.cache import obtenerCache, guardarCache


# ── Simulación básica ─────────────────────────────────────────────────────────

def testSimulacionBasica():
    r = calcularSimulacion(edad=28, sueldo=1_200_000, afp="uno", fondo="C", sexo="hombre")

    assert r["saldo_estimado"] > 0
    assert r["pension_mensual"] > 0
    assert r["anos_hasta_jubilacion"] == 37
    assert len(r["proyeccion_anual"]) == 37
    # Percentiles Monte Carlo presentes
    assert r["pension_p25"] <= r["pension_mensual"] <= r["pension_p75"]
    assert r["pension_p10"] <= r["pension_p25"]
    assert r["pension_p75"] <= r["pension_p90"]
    # Campos nuevos
    assert "total_comisiones" in r
    assert "total_cotizacion" in r
    assert "pgu_elegible" in r
    assert "pension_efectiva" in r
    assert "edad_jubilacion" in r
    assert r["edad_jubilacion"] == 65


def testSimulacionMujer():
    r = calcularSimulacion(edad=28, sueldo=1_200_000, afp="uno", fondo="C", sexo="mujer")

    assert r["anos_hasta_jubilacion"] == 32  # jubila a 60
    assert r["edad_jubilacion"] == 60
    assert len(r["proyeccion_anual"]) == 32


def testComision10PorcientoSiempreVaAlaCuenta():
    """La comisión AFP no reduce el saldo acumulado: siempre va 10% a la cuenta."""
    r_uno     = calcularSimulacion(edad=28, sueldo=1_200_000, afp="uno",     fondo="C")
    r_provida = calcularSimulacion(edad=28, sueldo=1_200_000, afp="provida", fondo="C")

    # Misma cotización → mismo saldo y misma pensión base
    assert r_uno["saldo_estimado"] == r_provida["saldo_estimado"]
    assert r_uno["pension_mensual"] == r_provida["pension_mensual"]

    # AFP más barata cobra menos comisión
    assert r_uno["total_comisiones"] < r_provida["total_comisiones"]


def testFondoAGeneraMayorSaldo():
    r_a = calcularSimulacion(edad=28, sueldo=1_200_000, afp="uno", fondo="A")
    r_e = calcularSimulacion(edad=28, sueldo=1_200_000, afp="uno", fondo="E")

    assert r_a["saldo_estimado"] > r_e["saldo_estimado"]


def testEdadCercanaJubilacionProduceProyeccionCorta():
    r = calcularSimulacion(edad=63, sueldo=800_000, afp="habitat", fondo="D", sexo="hombre")

    assert r["anos_hasta_jubilacion"] == 2
    assert len(r["proyeccion_anual"]) == 2


def testSaldoInicialSeSuma():
    sin_saldo = calcularSimulacion(edad=40, sueldo=1_000_000, afp="uno", fondo="C", saldo_actual=0)
    con_saldo = calcularSimulacion(edad=40, sueldo=1_000_000, afp="uno", fondo="C", saldo_actual=10_000_000)

    assert con_saldo["saldo_estimado"] > sin_saldo["saldo_estimado"]


def testAPVMejoraPension():
    sin_apv = calcularSimulacion(edad=35, sueldo=1_500_000, afp="uno", fondo="C", apv_mensual=0)
    con_apv = calcularSimulacion(edad=35, sueldo=1_500_000, afp="uno", fondo="C", apv_mensual=100_000)

    assert con_apv["saldo_estimado"] > sin_apv["saldo_estimado"]
    assert con_apv["total_apv"] > 0


def testPGUActivaCuandoPensionBaja():
    """Sueldo mínimo + edad avanzada → pensión estimada probablemente < PGU."""
    r = calcularSimulacion(edad=63, sueldo=460_000, afp="provida", fondo="E")

    if r["pgu_elegible"]:
        assert r["pension_efectiva"] == r["pgu_monto"]
    else:
        assert r["pension_efectiva"] == r["pension_mensual"]


def testProyeccionAnualEsCreciente():
    proyeccion = calcularProyeccionAnual(edad=28, sueldo=1_000_000, afp="uno", fondo="C")
    saldos = [p["saldo"] for p in proyeccion]

    assert saldos == sorted(saldos)


def testProyeccionContieneColumnasBandas():
    proyeccion = calcularProyeccionAnual(
        edad=28, sueldo=1_000_000, afp="uno", fondo="C",
        bandas_p25=[0] * 37, bandas_p75=[0] * 37,
    )
    assert "saldo_p25" in proyeccion[0]
    assert "saldo_p75" in proyeccion[0]
    assert "costo_comision_anual" in proyeccion[0]
    assert "apv_anual" in proyeccion[0]


# ── Comparador ────────────────────────────────────────────────────────────────

def testComparadorRetorna7AFPs():
    filas = compararAFPs(edad=28, sueldo=1_200_000, fondo="C")
    assert len(filas) == 7


def testComparadorOrdenadoPorComision():
    filas = compararAFPs(edad=28, sueldo=1_200_000, fondo="C")
    comisiones = [f["total_comisiones"] for f in filas]
    assert comisiones == sorted(comisiones)


def testComparadorSobrecostoVsMinima():
    filas = compararAFPs(edad=28, sueldo=1_200_000, fondo="C")
    # La más barata tiene sobrecosto = 0
    assert filas[0]["sobrecosto_vs_minima"] == 0
    # El resto tiene sobrecosto > 0
    assert all(f["sobrecosto_vs_minima"] >= 0 for f in filas)


# ── Validaciones de modelo ────────────────────────────────────────────────────

def testSimulacionInputValida():
    datos = SimulacionInput(edad=28, sueldo=1_200_000, afp="uno", fondo="C")
    assert datos.edad == 28
    assert datos.afp == "uno"
    assert datos.sexo == "hombre"
    assert datos.apv_mensual == 0


def testSimulacionInputAfpInvalida():
    with pytest.raises(Exception):
        SimulacionInput(edad=28, sueldo=1_200_000, afp="inexistente", fondo="C")


def testSimulacionInputEdadFueraDeRango():
    with pytest.raises(Exception):
        SimulacionInput(edad=15, sueldo=1_200_000, afp="uno", fondo="C")


def testSimulacionInputEdadMaxMujer():
    """Mujer no puede tener 60+ (jubila a 60)."""
    with pytest.raises(Exception):
        SimulacionInput(edad=60, sueldo=1_200_000, afp="uno", fondo="C", sexo="mujer")


def testSimulacionInputEdadMaxHombre():
    """Hombre no puede tener 65+ (jubila a 65)."""
    with pytest.raises(Exception):
        SimulacionInput(edad=65, sueldo=1_200_000, afp="uno", fondo="C", sexo="hombre")


def testSimulacionInputFondoInvalido():
    with pytest.raises(Exception):
        SimulacionInput(edad=28, sueldo=1_200_000, afp="uno", fondo="Z")


# ── Cache ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def testCacheGuardarYObtener():
    await guardarCache("test_key", {"valor": 123}, 60)
    resultado = await obtenerCache("test_key")
    assert resultado == {"valor": 123}


@pytest.mark.asyncio
async def testCacheKeyInexistente():
    resultado = await obtenerCache("key_que_no_existe_xyz")
    assert resultado is None
