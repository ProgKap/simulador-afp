"""
Actualizar cache de comisiones AFP.
Usa datos locales sin dependencias externas.
"""

import json
from datetime import datetime
from pathlib import Path


def log_message(msg: str, level: str = "INFO"):
    """Log con timestamp."""
    ts = datetime.now().isoformat()
    print(f"[{ts}] {level}: {msg}")


def update_comisiones_cache():
    """Actualiza timestamp del cache de comisiones."""
    cache_file = Path(__file__).parent.parent / "data" / "comisiones_cache.json"

    log_message("=" * 60)
    log_message("Actualizando cache de comisiones")
    log_message("=" * 60)

    if not cache_file.exists():
        log_message(f"Cache no existe: {cache_file}", "WARNING")
        return 1

    try:
        with open(cache_file) as f:
            data = json.load(f)

        # Actualizar timestamp
        data["timestamp"] = datetime.now().isoformat()

        with open(cache_file, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        log_message(f"✓ Cache actualizado")
        log_message(f"  AFPs: {len(data.get('data', {}))}")
        log_message(f"  Timestamp: {data['timestamp']}")
        log_message("=" * 60)
        log_message("✓ Cache de comisiones actualizado exitosamente")
        log_message("=" * 60)
        return 0

    except Exception as e:
        log_message(f"Error: {str(e)}", "ERROR")
        return 1


if __name__ == "__main__":
    exit(update_comisiones_cache())
