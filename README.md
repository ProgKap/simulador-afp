# AFP Simulator Chile

[![CI/CD Pipeline](https://github.com/ProgKap/simulador-afp/actions/workflows/ci.yml/badge.svg)](https://github.com/ProgKap/simulador-afp/actions/workflows/ci.yml)
[![Daily Data Sync](https://github.com/ProgKap/simulador-afp/actions/workflows/actualizar-datos.yml/badge.svg)](https://github.com/ProgKap/simulador-afp/actions/workflows/actualizar-datos.yml)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue)](https://www.python.org/downloads/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Motor de simulación de pensión AFP con datos en vivo desde el Banco Central de Chile.**

Simulador open source para proyectar tu pensión en el sistema previsional chileno. Utiliza **rentabilidades históricas reales** (1985–2026), **simulación Monte Carlo** (n=2.000) para análisis de riesgo, y **comparador de las 7 AFPs** con análisis de comisiones en toda tu vida laboral.

### Características Clave

- **Simulación precisa**: 10% de cotización va íntegro a la cuenta (corrige simuladores que descuentan comisión del saldo)
- **Monte Carlo n=2.000**: Percentiles p10/p25/p50/p75/p90 con volatilidad histórica real por fondo
- **Indicadores económicos en vivo**: UTM, UF, IPC, TPM, tipo de cambio desde BCCH (sincronización diaria)
- **PGU automática**: Detecta si tu pensión está bajo la Pensión Garantizada Universal ($214.296/mes) y lo explica
- **APV Tipo A**: Simula impacto del ahorro previsional voluntario con bonificación fiscal del 15%
- **Comparador de AFPs**: Total de comisiones pagadas en toda tu vida laboral para cada AFP
- **Análisis de contexto**: Tasa de reemplazo, comparación con sueldo mínimo/promedio, alertas
- **Responsive**: Optimizado para escritorio y móvil
- **Production-ready**: CI/CD automático, tests completos, seguridad configurada

## Acceso

> **Demo online**: [https://simulador-afp.vercel.app](https://simulador-afp.vercel.app)  
> **Corre localmente**: Ver [instrucciones de setup](#setup-local)


## Stack Técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | Next.js 16, React 19, TypeScript | SSR para SEO, performance optimizado, componentes reutilizables |
| **Visualización** | Recharts | Gráficos interactivos, responsive, accesible |
| **Backend** | FastAPI, Pydantic v2 | Async nativo, validación automática, documentación auto-generada (Swagger) |
| **Cálculos** | NumPy, Polars | Monte Carlo eficiente, análisis vectorizado, comparaciones rápidas |
| **Datos económicos** | BCCH SI3 API REST | Datos oficiales en vivo, actualización automática diaria |
| **Persistencia** | SQLAlchemy + Alembic | ORM tipado, migraciones versionadas, soporte PostgreSQL/SQLite |
| **Testing** | Pytest (backend), Vitest (frontend) | Cobertura automática, ejecución en CI/CD |
| **Linting** | Ruff (Python), ESLint (TypeScript) | Código consistente, detección temprana de errores |
| **CI/CD** | GitHub Actions | Workflows paralelos, validaciones en cada push, sincronización automática |

## Datos Económicos en Vivo

El simulador **sincroniza diariamente** indicadores del Banco Central de Chile. Esta arquitectura garantiza:

- ✅ **Precisión**: Datos oficiales, no estimaciones
- ✅ **Actualización automática**: Sin intervención manual
- ✅ **Resiliencia**: Fallback automático si BCCH no disponible
- ✅ **Legal**: Datos públicos con autorización explícita de BCCH

### Indicadores Sincronizados

| Indicador | Serie BCCH | Tipo | Impacto en simulación |
|-----------|-----------|------|----------------------|
| **UTM** | F047.UTM.IND.N.M | Tributario | Tope bonificación APV Tipo A (6 UTM máx/año) |
| **UF** | F047.UF.IND.N.M | Indexación | Revalorización de fondos e hipotecas |
| **IPC** | F028.LBS.IPC.Z.Z.T.M | Inflación | Deflactación de pensión futura a pesos reales |
| **TPM** | F046.TASA.CB.N.D | Política monetaria | Contexto de tasa de interés real esperada |
| **TCO** | F001.TCO.CLP.N.D | Cambio | Exposición a USD (fondos con inversión externa) |
| **Tasa Depósitos** | F080.RD.CLP.D.M | Rentabilidad | Benchmark conservador de rentabilidad |
| **Desempleo** | F036.SEG.EMP.N.M | Laboral | Riesgo de inactividad / brecha de aportes |

### Comisiones AFP

**Actualización manual mensual** (legal y profesional)

Las comisiones de AFP son independientes de datos macroeconómicos. Se actualizan mensualmente verificando sitios oficiales de cada AFP:
- **Comisión fija**: % del sueldo (por AFP)
- **Comisión variable**: % de las ganancias

Esto garantiza:
- ✅ **Legalidad**: No depende de APIs privadas (respeta ToS)
- ✅ **Precisión**: Verificación manual en fuentes oficiales
- ✅ **Responsabilidad**: Tu actualización = tus datos garantizados precisos

**Archivo**: [`backend/data/comisiones_cache.json`](backend/data/comisiones_cache.json)  
**Frecuencia**: 1x mes (primer día hábil)

### Arquitectura de Datos

```
Banco Central (diariamente 06:00 UTC)
    ↓
refresh_indicadores.py → obtiene 7 series en paralelo
    ↓
Cache en memoria (24 horas)
    ↓
Fallback automático si BCCH no disponible
    ↓
API /indicadores disponible para simulador

Comisiones AFP (manual, 1x mes)
    ↓
comisiones_cache.json → verificado en sitios oficiales
    ↓
API /comisiones disponible para simulador
```

Ver [`.github/workflows/actualizar-datos.yml`](.github/workflows/actualizar-datos.yml) para configuración de sincronización automática.

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

### Banco Central de Chile (BCCH) — Sincronización Diaria

El backend obtiene **7 indicadores en vivo** desde [API SI3 del BCCH](https://si3.bcentral.cl):

```
Series SI3 (sincronización 06:00 UTC):
├─ F047.UTM.IND.N.M        → UTM mensual (CLP)
├─ F047.UF.IND.N.M         → UF mensual (CLP)
├─ F028.LBS.IPC.Z.Z.T.M    → IPC mensual (%)
├─ F046.TASA.CB.N.D        → TPM (% anual)
├─ F001.TCO.CLP.N.D        → Tipo cambio (CLP/USD)
├─ F080.RD.CLP.D.M         → Tasa depósitos (%)
└─ F036.SEG.EMP.N.M        → Tasa desempleo (%)
```

**Fallback automático**: Si BCCH no responde, usa últimos valores conocidos (conservadores, actualizados mensualmente).

**Registrarse en BCCH**:
1. Ve a [si3.bcentral.cl](https://si3.bcentral.cl)
2. Crea una cuenta
3. Activa "Acceso a Servicios Web" en tu perfil
4. Configura `BCCH_USER` y `BCCH_PASS` en GitHub Secrets

### Datos Internos (Históricos)

| Dato | Fuente | Actualización | Notas |
|------|--------|---------------|-------|
| Rentabilidades históricas | Superintendencia de Pensiones | Anual | 1985–2026, por fondo (A/B/C/D/E) |
| Comisiones AFP vigentes | Cache local | Manual | 7 AFPs, comisión fija + variable |
| Tablas mortalidad | RV-2014 CMF | Fijo | Legal, próxima revisión 2029 |
| PGU (Pensión Garantizada) | Ley 21.419 | Anual | Indexada por BCCH (IPC) |
| Salario mínimo | Ley 21.625 | Anual | Vigente desde cada julio |

### Notas Técnicas

**APV Tipo A — Bonificación correcta**:
- Tope de **6 UTM** = bonificación anual del Estado (máximo, no aporte)
- Máximo aporte elegible: **40 UTM/año** (~$2,73M en 2026)
- Fórmula: `bonificacion_estado = min(aporte_mensual × 12 × 15%, 6_UTM_anual)`

**Rentabilidad real vs nominal**:
- Simulador usa **rentabilidades reales históricas** (descontada inflación)
- Proyección: multiplica por (1 + rentabilidad real) × (1 + inflación esperada)
- Proyección conservadora: inflación 2.5–3.5% anual

**UF en créditos hipotecarios**:
- Importante para ahorro-pensión con inversión inmobiliaria
- Fluctúa según IPC (correlación 1:1)

## Fuentes de datos

- Rentabilidades históricas: [Superintendencia de Pensiones](https://www.spensiones.cl)
- Tablas de mortalidad: RV-2014 (CMF Chile)
- Comisiones vigentes: API pública / queafp.cl
- PGU: Ley 21.419 y actualizaciones posteriores
- UTM e IPC: [Banco Central de Chile — API SI3](https://si3.bcentral.cl)
- Salario mínimo: Ley 21.625 y actualizaciones

## Licencia

MIT — ver [LICENSE](LICENSE).
