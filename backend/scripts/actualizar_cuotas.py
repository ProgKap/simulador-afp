"""
Actualizar comisiones y cuotas de AFP desde API quetalmiafp.
Ejecutado diariamente via GitHub Actions.
"""

import os
import json
import httpx
from datetime import datetime
from pathlib import Path

# Configuración
API_KEY = os.getenv("QUETALMIAFP_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Rutas
CACHE_DIR = Path(__file__).parent.parent / "data"
CACHE_FILE = CACHE_DIR / "comisiones_cache.json"


def log_message(message: str, level: str = "INFO"):
    """Log con timestamp."""
    timestamp = datetime.now().isoformat()
    print(f"[{timestamp}] {level}: {message}")


def fetch_comisiones_from_api() -> dict | None:
    """
    Obtiene comisiones actualizadas desde API quetalmiafp.
    Retorna dict con comisiones o None si falla.
    """
    if not API_KEY:
        log_message("QUETALMIAFP_API_KEY no configurada", "WARNING")
        return None

    try:
        log_message("Conectando a quetalmiafp...")
        async def fetch():
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(
                    "https://api.quetalmiafp.com/comisiones",
                    headers={"Authorization": f"Bearer {API_KEY}"},
                )
                response.raise_for_status()
                return response.json()

        # Ejecutar async
        import asyncio
        data = asyncio.run(fetch())
        log_message(f"✓ Comisiones obtenidas: {len(data)} AFPs")
        return data

    except httpx.HTTPStatusError as e:
        log_message(f"Error HTTP {e.response.status_code}: {e.response.text}", "ERROR")
        return None
    except Exception as e:
        log_message(f"Error al conectar API: {str(e)}", "ERROR")
        return None


def save_to_cache(data: dict) -> None:
    """Guarda comisiones en cache local."""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_data = {
            "timestamp": datetime.now().isoformat(),
            "data": data,
        }
        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        log_message(f"✓ Cache guardado en {CACHE_FILE}")
    except Exception as e:
        log_message(f"Error al guardar cache: {str(e)}", "ERROR")


def save_to_supabase(data: dict) -> bool:
    """
    Guarda comisiones en Supabase si está configurado.
    Retorna True si éxito, False si falla o no está configurado.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        log_message("Supabase no configurada (opcional)", "INFO")
        return False

    try:
        log_message("Guardando en Supabase...")
        import asyncio

        async def insert():
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/comisiones_historicas",
                    headers={
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal",
                    },
                    json={
                        "fecha": datetime.now().date().isoformat(),
                        "datos": json.dumps(data),
                    },
                )
                response.raise_for_status()
                return True

        success = asyncio.run(insert())
        if success:
            log_message("✓ Datos guardados en Supabase")
        return success

    except Exception as e:
        log_message(f"Error al guardar en Supabase: {str(e)}", "WARNING")
        return False


def main():
    """Ejecuta actualización de comisiones."""
    log_message("=" * 60)
    log_message("Iniciando actualización de comisiones AFP")
    log_message("=" * 60)

    # Obtener datos desde API
    comisiones = fetch_comisiones_from_api()

    if not comisiones:
        log_message("No se pudieron obtener comisiones desde API", "ERROR")
        log_message("Usando cache anterior si existe...")
        return 1

    # Guardar en cache local
    save_to_cache(comisiones)

    # Guardar en Supabase (opcional)
    save_to_supabase(comisiones)

    log_message("=" * 60)
    log_message("✓ Actualización completada exitosamente")
    log_message("=" * 60)
    return 0


if __name__ == "__main__":
    exit(main())
