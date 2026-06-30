# FraSoHome Fabric App / Rayfin

Este directorio es el origen versionable de la Fabric App desplegada como `frasohome-explorer`. No contiene `node_modules`, `dist`, `.env.local`, `rayfin/.env`, `rayfin/.deployments.json` ni otros artefactos de despliegue local.

La app:

- Se autentica embebida dentro del portal de Fabric.
- Lee del modelo semantico `frasohomeModel`.
- Muestra KPIs gobernados de ventas, margen, devolucion y clientes en riesgo.
- Filtra por canal y categoria.
- Lista los 25 clientes en riesgo mas prioritarios para reactivacion.
- Escribe acciones de negocio en la entidad Rayfin `ReactivacionCliente`.

## Requisitos

- Node.js 22.
- Acceso al tenant de Microsoft Fabric donde se va a crear o actualizar la app.
- Usuario con permisos de Admin o Member en el workspace destino.
- Fabric Apps / Rayfin habilitado en el tenant.
- Azure/Fabric sign-in disponible para el CLI Rayfin.
- Un modelo semantico FraSoHome ya creado con estas tablas:
  - `gold_fact_transacciones`
  - `gold_cliente_score`
  - `gold_producto_features`
  - `silver_crm`
  - `silver_productos`
  - `silver_tiendas`
- Medidas DAX del modelo semantico:
  - `Ventas netas`
  - `Margen bruto`
  - `Tasa devolucion`
  - `Clientes en riesgo`

## Estructura relevante

```text
rayfin/
  fabric.yaml                         Alias del modelo semantico usado por la app
  package.json                        Scripts de build, test y preview
  rayfin/rayfin.yml                   Configuracion del item Rayfin/Fabric App
  rayfin/data/ReactivacionCliente.ts  Entidad de write-back
  rayfin/data/schema.ts               Esquema Rayfin expuesto al cliente
  src/App.tsx                         Orquestacion de queries y write-back
  src/app/App.tsx                     UI FraSoHome
  src/hooks/use-semantic-model-query.ts
  src/lib/fabric-client.ts
  src/lib/rayfin-client.ts
  src/queries/frasohome/*.dax         Consultas DAX ejecutadas por la app
```

## Configuracion del modelo semantico

`fabric.yaml` define el alias que usa el codigo:

```yaml
semanticModels:
  frasohomeModel:
    workspaceId: 24863d42-e994-4e2c-8368-dee6aad6667a
    itemId: 754fff03-2c25-4454-ba29-11582782aa21
```

Para otro tenant o workspace, cambia `workspaceId` e `itemId` por los del modelo semantico destino. El build genera `src/fabric.generated.ts` desde este archivo; no edites ese generado.

## Desarrollo local embebido en Fabric

Instala dependencias:

```powershell
cd C:\Repos\tenerife-summer-sessions-2026\rayfin
npm install
```

Inicia o selecciona el item Fabric App. Este comando despliega la configuracion Rayfin en Fabric y genera `rayfin/.env`; usa `--dry-run` primero si solo quieres revisar operaciones:

```powershell
npx rayfin up --workspace-id <workspace-guid> --dry-run
npx rayfin up --workspace-id <workspace-guid>
```

Alternativamente puedes usar la URL del workspace:

```powershell
npx rayfin up --workspace-uri "https://app.fabric.microsoft.com/groups/<workspace-guid>/list"
```

Levanta Vite:

```powershell
npm run dev
```

Abre el item de Fabric con `devUri=http://localhost:5173`. El repo incluye un helper:

```powershell
npm run test:fabric
```

## Build y despliegue

Validacion local sin desplegar:

```powershell
npm run test
npm run build
```

El build ejecuta:

```text
npx fabric-app-data generate -o src/fabric.generated.ts
tsc -b --noCheck
vite build
```

Despliegue al item Fabric App:

```powershell
npx rayfin up --workspace-id <workspace-guid>
```

`rayfin/rayfin.yml` indica que el hosting estatico usa `dist`, `index.html` y `npm run build:fabric`:

```yaml
staticHosting:
  enabled: true
  folder: dist
  buildCommand: npm run build:fabric
  indexDocument: index.html
```

No uses `--force` salvo que aceptes cambios destructivos de esquema de datos. Para comprobar el estado despues del despliegue:

```powershell
npx rayfin up status
npx rayfin up list
```

## Consultas que ejecuta

La app ejecuta dos DAX contra el alias `frasohomeModel`.

### KPIs

Archivo: `src/queries/frasohome/kpis.dax`

```dax
EVALUATE
CALCULATETABLE(
    ROW(
        "Ventas netas", [Ventas netas],
        "Margen bruto", [Margen bruto],
        "Tasa devolucion", [Tasa devolución],
        "Clientes en riesgo", [Clientes en riesgo]
    ),
    __CHANNEL_FILTER__,
    __CATEGORY_FILTER__
)
```

El codigo sustituye:

- `__CHANNEL_FILTER__` por `ALL(gold_fact_transacciones[canal_movimiento])` o `TREATAS({"POS"|"ONLINE"}, gold_fact_transacciones[canal_movimiento])`.
- `__CATEGORY_FILTER__` por `ALL(gold_fact_transacciones[categoria])` o `TREATAS({"Decoracion"|"Iluminacion"|"Muebles"|"Textil hogar"}, gold_fact_transacciones[categoria])`.

### Clientes en riesgo

Archivo: `src/queries/frasohome/risk-customers.dax`

La consulta:

- Parte de `gold_cliente_score`.
- Filtra `riesgo_fuga = TRUE()`.
- Conserva solo clientes con movimientos para los filtros seleccionados.
- Calcula el canal dominante desde `gold_fact_transacciones[canal_movimiento]`.
- Calcula la categoria preferida por ventas desde `gold_fact_transacciones[categoria]`.
- Devuelve los 25 clientes con menor `score`, mayor `recencia_dias` y mayor `gasto_total`.

Columnas devueltas:

```text
customer_id
canal
score
recencia_dias
gasto_total
tasa_devolucion_cliente
categoria_preferida
```

## Write-back

El boton `Anadir` crea un registro en `ReactivacionCliente`:

```text
customer_id
score
recencia_dias
categoria_preferida
oferta_sugerida
en_campania
creado_el
```

La oferta sugerida se calcula en `src/App.tsx` con reglas simples por categoria:

- `Muebles`: `10% en montaje y envio premium`
- `Iluminacion`: `Pack iluminacion con envio gratuito`
- `Textil hogar`: `Renovacion textil con descuento VIP`
- Resto: `Campania de reactivacion personalizada`

Si el write-back falla, la app mantiene la experiencia visual y escribe el error en consola para no bloquear la demo.
