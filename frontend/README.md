# AFP Simulator Chile

Simulador previsional open source que proyecta tu pensión AFP usando rentabilidades históricas reales del sistema chileno. Calcula el saldo acumulado año a año, aplica el tope imponible (DL 3.500), muestra el desglose con PGU, compara comisiones entre todas las AFPs y corre 2.000 escenarios probabilísticos para dar rangos pesimista/optimista.

🔗 [simulador-afp.vercel.app](https://simulador-afp.vercel.app)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | CSS custom properties + Tailwind utilities |
| Gráficos | Recharts |
| Datos externos | Banco Central de Chile REST API (UTM, IPC) |
| Deploy | Vercel |
| CI | GitHub Actions |

---

## Funcionalidades

- **Simulación previsional** — proyección año a año con rentabilidades reales históricas (SP Chile 2002-2024)
- **Tope imponible** — aplica el límite de 82.6 UF/mes según DL 3.500 Art. 14
- **PGU dinámica** — desglose AFP + suplemento Estado + total, valor vía `/api/indicadores`
- **Análisis probabilístico** — 2.000 escenarios con bandas p25/p75 en el gráfico
- **Comparador de AFPs** — muestra el costo total en comisiones para cada AFP con el mismo perfil
- **APV Tipo A** — bonificación fiscal del 15%, tope 6 UTM/año
- **UTM e IPC en vivo** — consumidos desde el BCCH API con caché de 24h y fallback automático
- **Mobile-first** — tabs Datos/Resultados en móvil, layout de dos columnas en desktop

---

## Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Variables de entorno (opcional — el simulador funciona sin ellas)
cp ../.env.example .env.local
# Edita .env.local con tus credenciales BCCH si tienes

# Servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `BCCH_USER` | Usuario API Banco Central | No — usa fallback |
| `BCCH_PASS` | Contraseña API Banco Central | No — usa fallback |

Sin credenciales BCCH el simulador usa valores de respaldo actualizados (UTM $68.306, IPC 3.5%).

Para Vercel: agrega las variables en **Settings → Environment Variables**.

---

## API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/simular` | POST | Calcula la simulación completa |
| `/api/comparar` | POST | Compara comisiones entre todas las AFPs |
| `/api/indicadores` | GET | UTM, IPC, salario mínimo, PGU vigente |
| `/api/comisiones` | GET | Tasas de comisión actuales por AFP |
| `/api/health` | GET | Estado del servicio |

---

## Estructura

```
src/
├── app/
│   ├── api/          # Next.js API routes (backend)
│   ├── globals.css   # Design tokens + component styles
│   ├── layout.tsx
│   └── page.tsx      # Página principal + lógica de estado
├── components/
│   ├── SimuladorForm.tsx
│   ├── ProyeccionChart.tsx
│   ├── ComparativaTable.tsx
│   ├── MetricCard.tsx
│   ├── ContextoPension.tsx
│   ├── PguDesglose.tsx
│   ├── EmptyState.tsx
│   └── ErrorBoundary.tsx
└── lib/
    ├── simulator.ts  # Lógica de simulación AFP
    ├── bcch.ts       # Cliente Banco Central de Chile
    ├── api.ts        # Funciones fetch al backend
    └── types.ts      # Tipos TypeScript compartidos
```

---

## Metodología de cálculo

- **Rentabilidades**: promedios reales históricos SP Chile 2002-2024, ajustados por inflación (~3.5%). Fondo A: 3.9%, B: 2.9%, C: 1.8%, D: 1.0%, E: 0.5%
- **Pensión**: `saldo_final ÷ meses_esperanza_vida` (conservador, sin fórmula PMT)
- **PGU**: si pensión AFP < $214.296, el Estado cubre la diferencia
- **Tope imponible**: máximo 82.6 UF/mes cotizable (~$3.122.280 con UF $37.800)
- **APV Tipo A**: bonificación 15% sobre aportes, tope 6 UTM/año

> No constituye asesoría financiera. Fuente: Superintendencia de Pensiones de Chile.

---

## Licencia

MIT
