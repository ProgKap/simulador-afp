import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.cache import obtenerCache, guardarCache
from app.config import settings

CACHE_KEY_COMISIONES = "afp:comisiones"
CACHE_TTL_SEGUNDOS = 86400


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(httpx.HTTPError),
)
async def _fetchComisionesAPI() -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://queafp.cl/api/comisiones",
            headers={"Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()


async def obtenerComisiones() -> dict:
    cached = await obtenerCache(CACHE_KEY_COMISIONES)
    if cached:
        return cached

    try:
        datos = await _fetchComisionesAPI()
        await guardarCache(CACHE_KEY_COMISIONES, datos, CACHE_TTL_SEGUNDOS)
        return datos
    except Exception:
        # Circuit breaker: si la API falla tras los reintentos, usa datos locales
        from app.simulator import COMISIONES
        return COMISIONES