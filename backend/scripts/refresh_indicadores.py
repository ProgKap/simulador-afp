"""
Refrescar indicadores desde Banco Central de Chile.
Ejecutado diariamente vía GitHub Actions.
"""

import os
from datetime import datetime
from app.bcch_client import refresh_indicadores
from app.config import settings


def log_message(msg: str, level: str = "INFO"):
    """Log con timestamp."""
    ts = datetime.now().isoformat()
    print(f"[{ts}] {level}: {msg}")


async def main():
    """Refresca indicadores del BCCH."""
    log_message("=" * 60)
    log_message("Iniciando actualización de indicadores BCCH")
    log_message("=" * 60)

    if not settings.BCCH_USER or not settings.BCCH_PASS:
        log_message("BCCH_USER/BCCH_PASS no configuradas", "WARNING")
        return 1

    try:
        log_message("Conectando a Banco Central de Chile...")
        data = await refresh_indicadores(settings.BCCH_USER, settings.BCCH_PASS)

        if data:
            log_message(f"✓ Indicadores actualizados:")
            log_message(f"  UTM: ${data.get('utm', 'N/A')}")
            log_message(f"  IPC: {data.get('ipc', 'N/A')}%")
            log_message(f"  Sueldo Mínimo: ${data.get('sueldo_minimo', 'N/A')}")
            log_message("=" * 60)
            log_message("✓ Actualización completada exitosamente")
            log_message("=" * 60)
            return 0
        else:
            log_message("No se obtuvieron indicadores", "ERROR")
            return 1

    except Exception as e:
        log_message(f"Error: {str(e)}", "ERROR")
        return 1


if __name__ == "__main__":
    import asyncio
    exit(asyncio.run(main()))
