# AFP Simulator Chile

Simulador open source de pensión AFP para el sistema previsional chileno.  
Calcula tu pensión estimada con **rentabilidades históricas reales**, **Monte Carlo** (n=2.000 simulaciones), comparador de todas las AFPs, contexto educativo y soporte para APV.

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
# Edita .env si necesitas integraciones externas (opcional para uso básico)

uvicorn main:app --reload
# API disponible en http://localhost:8000
# Docs en http://localhost:8000/docs
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

## Integración Banco Central de Chile

El endpoint `/indicadores` obtiene datos macro directamente desde la [API REST del BCCH](https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx):

| Variable        | Serie BCCH              | Uso en el simulador                         |
|-----------------|-------------------------|---------------------------------------------|
| UTM mensual     | `F047.UTM.IND.N.M`      | Límite de bonificación APV Tipo A (6 UTM/año) |
| IPC mensual     | `F028.LBS.IPC.Z.Z.T.M`  | Contexto inflacionario                      |
| Salario mínimo  | —                       | Comparación de pensión vs sueldo mínimo     |

**Comportamiento con fallback**: si el API BCCH no está disponible (error de red, cuenta no activada, etc.), el simulador usa valores actualizados hardcodeados y continúa funcionando normalmente. El frontend indica si los datos provienen de BCCH en vivo o del fallback.

**Activar cuenta BCCH**: regístrate en [si3.bcentral.cl](https://si3.bcentral.cl) y activa el acceso a servicios web en el perfil de tu cuenta.

**APV Tipo A — corrección técnica**: el tope de 6 UTM es el máximo de *bonificación anual del Estado*, no el máximo de aporte. El aporte máximo para recibir la bonificación completa es 40 UTM/año (~$2,73M). La fórmula correcta es `bonificacion = min(apv_anual × 15%, 6 UTM)`.

## Fuentes de datos

- Rentabilidades históricas: [Superintendencia de Pensiones](https://www.spensiones.cl)
- Tablas de mortalidad: RV-2014 (CMF Chile)
- Comisiones vigentes: API pública / queafp.cl
- PGU: Ley 21.419 y actualizaciones posteriores
- UTM e IPC: [Banco Central de Chile — API SI3](https://si3.bcentral.cl)
- Salario mínimo: Ley 21.625 y actualizaciones

## Licencia

MIT — ver [LICENSE](LICENSE).
