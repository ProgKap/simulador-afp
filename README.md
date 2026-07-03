# AFP Simulator Chile

[![CI/CD Pipeline](https://github.com/ProgKap/simulador-afp/actions/workflows/ci.yml/badge.svg)](https://github.com/ProgKap/simulador-afp/actions/workflows/ci.yml)
[![Daily Data Sync](https://github.com/ProgKap/simulador-afp/actions/workflows/actualizar-datos.yml/badge.svg)](https://github.com/ProgKap/simulador-afp/actions/workflows/actualizar-datos.yml)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue)](https://www.python.org/downloads/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Simulador open source de pensión AFP para el sistema previsional chileno.

Calcula tu pensión estimada con **rentabilidades históricas reales**, **Monte Carlo** (n=2.000 simulaciones), comparador de todas las AFPs, contexto educativo y soporte para APV.

**Datos en vivo desde Banco Central de Chile** — UTM, IPC y salario mínimo actualizados diariamente.

Producción-ready con CI/CD automático, tests completos, seguridad configurada y datos sincronizados diariamente.

## Demo

> Despliega en Vercel o corre localmente — ver instrucciones abajo.

## Características

- **Simulación precisa**: el 10% de cotización va íntegro a la cuenta (corrección sobre simuladores que descuentan la comisión del saldo)
- **Monte Carlo n=2.000**: percentiles p10/p25/p50/p75/p90 con volatilidad histórica real por fondo
- **Banda de confianza** en el gráfico de proyección (rango p25–p75 año a año)
- **PGU automática**: detecta si tu pensión proyectada está bajo la Pensión Garantizada Universal ($214.296/mes) y lo explica
- **APV Tipo A**: simula el impacto del ahorro previsional voluntario con bonificación fiscal del 15%
- **Comparador de AFPs**: muestra el total de comisiones pagadas en toda tu vida laboral para las 7 AFPs
- **Contexto educativo**: tasa de reemplazo, comparación con sueldo mínimo/promedio, alerta si es insuficiente
- **Permalink**: copia un link con tu simulación para compartir
- **Sexo correcto**: hombres jubilan a 65, mujeres a 60 (tablas de mortalidad RV-2014 CMF Chile)
- **SEO y OG tags** listos para producción
- **Responsive** para móvil

## Stack

| Capa     | Tecnología                       |
|----------|----------------------------------|
| Frontend | Next.js 16, React 19, Recharts   |
| Backend  | FastAPI, Pydantic v2             |
| Cómputo  | NumPy (Monte Carlo), Polars (comparador) |
| Caché    | In-memory (Redis-ready)          |
| DB       | SQLAlchemy + Alembic (opcional)  |

## Datos en Vivo

El simulador obtiene datos económicos **en vivo desde el Banco Central de Chile** mediante su API REST SI3:

| Indicador | Fuente | Frecuencia | Uso |
|-----------|--------|-----------|-----|
| **UTM** | BCCH SI3 F047.UTM.IND.N.M | Diaria | Tope de bonificación APV Tipo A |
| **IPC** | BCCH SI3 F028.LBS.IPC.Z.Z.T.M | Diaria | Indexación inflacionaria |
| **Comisiones AFP** | Cache local | Manual | Cálculo de costos (fallback si API indisponible) |

**Sincronización automática**: Todos los días a las 06:00 UTC (03:00 AM Chile) vía GitHub Actions.

**Fallback robusto**: Si el Banco Central no está disponible, usa valores de respaldo actualizados (último conocido).

Ver [`.github/workflows/actualizar-datos.yml`](.github/workflows/actualizar-datos.yml) para detalles.

---

## CI/CD Pipeline

Validación automática en cada push + sincronización diaria de datos:

### Validación (Pull Requests)
- **Frontend**: install → test (Vitest) → build (Next.js)
- **Backend**: install → lint (Ruff) → test (Pytest) → migrate (Alembic)

### Sincronización de Datos (Diaria 06:00 UTC)
- Refrescar indicadores desde Banco Central
- Actualizar cache de comisiones
- Validar estado de base de datos

Todos los workflows son **paralelos** y se ejecutan en ~45 segundos.

Ver workflows en [`.github/workflows/`](.github/workflows/) para detalles técnicos.

## Setup local

### Requisitos

- Python 3.11+
- Node.js 20+
- pnpm (o npm)

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Copia el .env de ejemplo
cp ../.env.example .env
```

**Configurar credenciales del Banco Central** (opcional para desarrollo local):

```bash
# Edita .env
BCCH_USER=tu_usuario
BCCH_PASS=tu_password
```

> Registrate en [si3.bcentral.cl](https://si3.bcentral.cl) para obtener credenciales. Sin estas, el simulador usa valores de respaldo.

```bash
# Inicia servidor
uvicorn main:app --reload
# API disponible en http://localhost:8000
# Docs interactivos en http://localhost:8000/docs (Swagger)
```

### Frontend

```bash
cd frontend
pnpm install   # o npm install

# Opcional: apunta al backend si cambiaste el puerto
echo "NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000" > .env.local

pnpm dev       # http://localhost:3000
```

### Tests backend

```bash
cd backend
pytest tests/ -v --cov=app
```

## Endpoints API

| Método | Ruta           | Descripción                                      |
|--------|----------------|--------------------------------------------------|
| POST   | `/simular`     | Calcula pensión, Monte Carlo, PGU, APV           |
| POST   | `/comparar`    | Compara las 7 AFPs para el mismo perfil          |
| GET    | `/indicadores` | UTM, IPC y salario mínimo desde BCCH             |
| GET    | `/comisiones`  | Comisiones vigentes (con fallback)               |
| GET    | `/health`      | Health check                                     |

**Ejemplo `/simular`:**
```json
{
  "edad": 30,
  "sexo": "hombre",
  "sueldo": 1200000,
  "afp": "uno",
  "fondo": "C",
  "saldo_actual": 5000000,
  "apv_mensual": 50000
}
```

## Variables de entorno

Ver [`.env.example`](.env.example). Todas son opcionales para uso básico local.

## Cómo contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Fuentes de Datos

### Banco Central de Chile (BCCH)

El backend sincroniza **diariamente** indicadores económicos desde la [API REST del BCCH](https://si3.bcentral.cl):

```
Series SI3:
├─ F047.UTM.IND.N.M       → UTM mensual (límite APV)
├─ F028.LBS.IPC.Z.Z.T.M   → IPC mensual (inflación)
└─ Salario mínimo vigente → Contexto salarial
```

**Fallback robusto**: Si BCCH no está disponible, el simulador usa el último valor conocido (actualizado mensualmente en el código).

**Registrarse en BCCH**:
1. Ve a [si3.bcentral.cl](https://si3.bcentral.cl)
2. Crea una cuenta
3. Activa "Acceso a Servicios Web" en tu perfil
4. Usa tus credenciales en `BCCH_USER` y `BCCH_PASS`

### Datos Internos

| Dato | Fuente | Actualización |
|------|--------|----------------|
| Rentabilidades históricas (1985-2026) | Superintendencia de Pensiones | Manual (cambios anuales) |
| Comisiones AFP vigentes | Cache local | Manual o API (cuando esté disponible) |
| Tablas de mortalidad | RV-2014 CMF Chile | Fijo (legal, cambios cada 5 años) |
| PGU (Pensión Garantizada) | Ley 21.419 | Anual (BCCH indexa) |

### Notas Técnicas

**APV Tipo A — fórmula correcta**:
- Tope de 6 UTM es la *bonificación anual del Estado*, no el máximo de aporte
- Máximo aporte para bonificación completa: 40 UTM/año (~$2,73M)
- Fórmula: `bonificacion = min(apv_anual × 15%, 6 UTM)`

## Fuentes de datos

- Rentabilidades históricas: [Superintendencia de Pensiones](https://www.spensiones.cl)
- Tablas de mortalidad: RV-2014 (CMF Chile)
- Comisiones vigentes: API pública / queafp.cl
- PGU: Ley 21.419 y actualizaciones posteriores
- UTM e IPC: [Banco Central de Chile — API SI3](https://si3.bcentral.cl)
- Salario mínimo: Ley 21.625 y actualizaciones

## Licencia

MIT — ver [LICENSE](LICENSE).
