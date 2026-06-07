"""
Cliente para la API REST del Banco Central de Chile (SI3).
Obtiene UTM, IPC y salario mínimo. Cachea 24 h y usa fallback si el API falla.
"""

import json
import logging
import time
from datetime import date, timedelta
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Series conocidas — SI3 REST GetSeries
_SERIES = {
    "utm": "F047.UTM.IND.N.M",
    "ipc": "F028.LBS.IPC.Z.Z.T.M",
}

# Valores de respaldo actualizados (junio 2026)
# UTM: valor mensual en CLP (fuente: SII histórico + proyección inflación)
# IPC: variación mensual del índice de precios al consumidor (INE)
# Salario mínimo: vigente desde julio 2024 (Ley 21.625)
_FALLBACK: dict = {
    "utm_valor":      68_306,
    "ipc_mensual":    0.003,   # 0.3 %
    "ipc_anual":      0.035,   # 3.5 %
    "salario_minimo": 500_000,
    "fuente":         "fallback",
}

_cache: dict = {}
_cache_ts: float = 0.0
_CACHE_TTL = 86_400  # 24 horas en segundos

_BCCH_URL = "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx"


def _parse_valor(raw: str) -> Optional[float]:
    try:
        return float(str(raw).replace(",", "."))
    except (ValueError, TypeError):
        return None


async def _fetch_series(
    client: httpx.AsyncClient,
    user: str,
    pw: str,
    series_code: str,
) -> Optional[float]:
    today = date.today().isoformat()
    three_months_ago = (date.today() - timedelta(days=90)).isoformat()
    try:
        r = await client.get(
            _BCCH_URL,
            params={
                "user":       user,
                "pass":       pw,
                "function":   "GetSeries",
                "timeseries": series_code,
                "firstdate":  three_months_ago,
                "lastdate":   today,
            },
            timeout=10.0,
        )
        data = json.loads(r.content.decode("latin-1"))
        if data.get("Codigo") != 0:
            logger.warning(
                "BCCH series %s: Codigo=%s, %s",
                series_code,
                data.get("Codigo"),
                str(data.get("Descripcion", ""))[:80],
            )
            return None
        obs = (data.get("Series") or {}).get("Obs") or []
        for ob in reversed(obs):
            val = _parse_valor(ob.get("valor", ""))
            if val is not None:
                return val
        return None
    except Exception as exc:
        logger.warning("BCCH fetch error for %s: %s", series_code, exc)
        return None


async def refresh_indicadores(user: str, pw: str) -> dict:
    """
    Actualiza el caché de indicadores desde BCCH.
    Siempre retorna un dict válido (fallback si el API falla).
    """
    global _cache, _cache_ts

    result: dict = dict(_FALLBACK)

    if user and pw:
        try:
            async with httpx.AsyncClient() as client:
                utm_raw = await _fetch_series(client, user, pw, _SERIES["utm"])
                ipc_raw = await _fetch_series(client, user, pw, _SERIES["ipc"])

            if utm_raw is not None and utm_raw > 50_000:
                result["utm_valor"] = int(utm_raw)
                result["fuente"] = "bcch"

            if ipc_raw is not None:
                # BCCH entrega variación en puntos porcentuales (e.g. 0.3)
                result["ipc_mensual"] = ipc_raw / 100
                result["ipc_anual"] = round((1 + ipc_raw / 100) ** 12 - 1, 4)
                if result["fuente"] != "bcch":
                    result["fuente"] = "bcch_partial"
        except Exception as exc:
            logger.error("BCCH integration error: %s", exc)

    _cache = result
    _cache_ts = time.time()
    return result


def get_cached_indicadores() -> dict:
    """Retorna el caché actual (fallback si nunca se refrescó)."""
    return _cache if _cache else dict(_FALLBACK)


def is_cache_stale() -> bool:
    return (time.time() - _cache_ts) >= _CACHE_TTL


def get_utm_valor() -> int:
    """Acceso rápido al valor UTM cacheado."""
    return get_cached_indicadores()["utm_valor"]
