import json
import httpx
from app.config import settings

CACHE: dict = {}


async def obtenerCache(key: str) -> dict | None:
    return CACHE.get(key)


async def guardarCache(key: str, valor: dict, ttl: int) -> None:
    CACHE[key] = valor