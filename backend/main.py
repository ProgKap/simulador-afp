from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.models import SimulacionInput, SimulacionOutput, ComparadorInput, ComparadorOutput
from app.simulator import calcularSimulacion, compararAFPs
from app.afp_client import obtenerComisiones
from app.bcch_client import refresh_indicadores, get_cached_indicadores, is_cache_stale
from app.config import settings

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Precarga indicadores al arrancar para que el simulador tenga UTM correcto
    await refresh_indicadores(settings.BCCH_USER, settings.BCCH_PASS)
    yield


app = FastAPI(
    title="AFP Simulator API",
    description="Motor de simulación de pensión con datos reales del sistema previsional chileno",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": app.version}


@app.post("/simular", response_model=SimulacionOutput)
@limiter.limit("20/minute")
async def simular(request: Request, datos: SimulacionInput):
    resultado = calcularSimulacion(
        edad=datos.edad,
        sueldo=datos.sueldo,
        afp=datos.afp,
        fondo=datos.fondo,
        saldo_actual=datos.saldo_actual,
        crecimiento_sueldo=datos.crecimiento_sueldo,
        sexo=datos.sexo,
        apv_mensual=datos.apv_mensual,
    )
    return SimulacionOutput(**resultado)


@app.post("/comparar", response_model=ComparadorOutput)
@limiter.limit("10/minute")
async def comparar(request: Request, datos: ComparadorInput):
    filas = compararAFPs(
        edad=datos.edad,
        sueldo=datos.sueldo,
        fondo=datos.fondo,
        saldo_actual=datos.saldo_actual,
        crecimiento_sueldo=datos.crecimiento_sueldo,
        sexo=datos.sexo,
        apv_mensual=datos.apv_mensual,
    )
    return ComparadorOutput(filas=filas)


@app.get("/comisiones")
@limiter.limit("60/minute")
async def comisiones(request: Request):
    return await obtenerComisiones()


@app.get("/indicadores")
@limiter.limit("30/minute")
async def indicadores(request: Request):
    """
    Retorna UTM, IPC y salario mínimo vigentes.
    Refresca desde el Banco Central de Chile si el caché está vencido (>24 h).
    """
    if is_cache_stale():
        data = await refresh_indicadores(settings.BCCH_USER, settings.BCCH_PASS)
    else:
        data = get_cached_indicadores()
    return data
