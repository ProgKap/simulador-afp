"""
Cliente para API REST del Banco Central de Chile (SI3).
Indicadores económicos en vivo para simulador de pensiones AFP.

Series sincronizadas diariamente:
- UTM: Unidad Tributaria Mensual (límite APV)
- UF: Unidad de Fomento (indexación de créditos)
- IPC: Índice de Precios al Consumidor (inflación)
- TPM: Tasa de Política Monetaria (contexto económico)
- TCO: Tipo de cambio observable USD/CLP
- Tasas de depósito: Referencia de rentabilidad bancaria

Cachea 24h y usa fallback automático si API no disponible.
"""

import json
import logging
import time
from datetime import date, timedelta
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# Series BCCH (SI3 REST)
_SERIES = {
    # Tributaria
    "utm": "F047.UTM.IND.N.M",
    "uf": "F047.UF.IND.N.M",

    # Precios & Inflación
    "ipc": "F028.LBS.IPC.Z.Z.T.M",

    # Tasas de política
    "tpm": "F046.TASA.CB.N.D",

    # Tipo de cambio
    "tco_usd": "F001.TCO.CLP.N.D",

    # Tasas de depósito (referencia)
    "tasa_deposito_clp": "F080.RD.CLP.D.M",

    # Empleo (contexto)
    "desempleo": "F036.SEG.EMP.N.M",
}

# Valores de respaldo actualizados (junio 2026)
# Basados en datos históricos + proyecciones conservadoras
_FALLBACK: dict = {
    "utm_valor": 68_306,  # CLP/mes
    "uf_valor": 36_865,   # CLP
    "ipc_mensual": 0.003,  # 0.3%
    "ipc_anual": 0.035,    # 3.5%
    "tpm": 3.50,  # % anual
    "tco_usd": 920,  # CLP/USD
    "tasa_deposito_clp": 3.80,  # % anual
    "desempleo": 7.2,  # %
    "salario_minimo": 500_000,  # CLP
    "fuente": "fallback",
    "timestamp": None,
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
    Sincroniza indicadores económicos desde BCCH.
    Obtiene múltiples series en paralelo.
    Siempre retorna dict válido (fallback si API falla).

    Returns:
        dict: indicadores con timestamp y fuente
    """
    global _cache, _cache_ts

    result: dict = dict(_FALLBACK)
    result["timestamp"] = date.today().isoformat()
    sources_ok = 0

    if not (user and pw):
        logger.info("BCCH credentials not configured, using fallback values")
        _cache = result
        _cache_ts = time.time()
        return result

    try:
        async with httpx.AsyncClient() as client:
            # Fetch todas las series en paralelo
            tasks = {
                key: _fetch_series(client, user, pw, code)
                for key, code in _SERIES.items()
            }

            # Esperar resultados
            utm_raw = await tasks["utm"]
            uf_raw = await tasks["uf"]
            ipc_raw = await tasks["ipc"]
            tpm_raw = await tasks["tpm"]
            tco_raw = await tasks["tco_usd"]
            tasa_dep_raw = await tasks["tasa_deposito_clp"]
            desempleo_raw = await tasks["desempleo"]

            # Procesar UTM
            if utm_raw is not None and 50_000 < utm_raw < 100_000:
                result["utm_valor"] = int(utm_raw)
                sources_ok += 1

            # Procesar UF
            if uf_raw is not None and 30_000 < uf_raw < 50_000:
                result["uf_valor"] = round(uf_raw, 2)
                sources_ok += 1

            # Procesar IPC (BCCH entrega en puntos porcentuales)
            if ipc_raw is not None and -2 < ipc_raw < 5:
                result["ipc_mensual"] = round(ipc_raw / 100, 6)
                result["ipc_anual"] = round((1 + ipc_raw / 100) ** 12 - 1, 4)
                sources_ok += 1

            # Procesar TPM
            if tpm_raw is not None and 0 < tpm_raw < 15:
                result["tpm"] = round(tpm_raw, 2)
                sources_ok += 1

            # Procesar TCO
            if tco_raw is not None and 600 < tco_raw < 1500:
                result["tco_usd"] = round(tco_raw, 2)
                sources_ok += 1

            # Procesar tasa de depósito
            if tasa_dep_raw is not None and 0 < tasa_dep_raw < 15:
                result["tasa_deposito_clp"] = round(tasa_dep_raw, 2)
                sources_ok += 1

            # Procesar desempleo
            if desempleo_raw is not None and 0 < desempleo_raw < 20:
                result["desempleo"] = round(desempleo_raw, 2)
                sources_ok += 1

            # Determinar fuente
            if sources_ok >= 5:
                result["fuente"] = "bcch"
            elif sources_ok >= 2:
                result["fuente"] = "bcch_partial"
                logger.warning(f"BCCH partial sync: {sources_ok}/7 series")
            else:
                logger.error(f"BCCH sync failed: only {sources_ok}/7 series obtained")

    except Exception as exc:
        logger.error(f"BCCH integration error: {exc}")

    _cache = result
    _cache_ts = time.time()
    return result


def get_cached_indicadores() -> dict:
    """Retorna el caché actual (fallback si nunca se refrescó)."""
    return _cache if _cache else dict(_FALLBACK)


def is_cache_stale() -> bool:
    return (time.time() - _cache_ts) >= _CACHE_TTL


def get_utm_valor() -> int:
    """UTM mensual en CLP."""
    return int(get_cached_indicadores().get("utm_valor", _FALLBACK["utm_valor"]))


def get_uf_valor() -> float:
    """UF (Unidad de Fomento) en CLP."""
    return float(get_cached_indicadores().get("uf_valor", _FALLBACK["uf_valor"]))


def get_ipc() -> dict:
    """IPC mensual y anual."""
    ind = get_cached_indicadores()
    return {
        "mensual": ind.get("ipc_mensual", _FALLBACK["ipc_mensual"]),
        "anual": ind.get("ipc_anual", _FALLBACK["ipc_anual"]),
    }


def get_tpm() -> float:
    """TPM (Tasa de Política Monetaria) en % anual."""
    return float(get_cached_indicadores().get("tpm", _FALLBACK["tpm"]))


def get_tipo_cambio() -> float:
    """TCO (Tipo de cambio observable) CLP/USD."""
    return float(get_cached_indicadores().get("tco_usd", _FALLBACK["tco_usd"]))


def get_tasa_deposito() -> float:
    """Tasa de referencia de depósitos en CLP (% anual)."""
    return float(get_cached_indicadores().get("tasa_deposito_clp", _FALLBACK["tasa_deposito_clp"]))


def get_desempleo() -> float:
    """Tasa de desempleo (%)."""
    return float(get_cached_indicadores().get("desempleo", _FALLBACK["desempleo"]))


def get_indicadores_summary() -> dict:
    """Resumen ejecutivo de indicadores económicos."""
    ind = get_cached_indicadores()
    return {
        "utm": ind.get("utm_valor"),
        "uf": ind.get("uf_valor"),
        "ipc_anual": ind.get("ipc_anual"),
        "tpm": ind.get("tpm"),
        "tco_usd": ind.get("tco_usd"),
        "desempleo": ind.get("desempleo"),
        "fuente": ind.get("fuente"),
        "timestamp": ind.get("timestamp"),
    }
