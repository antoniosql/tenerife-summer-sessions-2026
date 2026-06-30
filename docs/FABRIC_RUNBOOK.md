# FraSoHome Fabric Demo Runbook

Este repositorio contiene el codigo fuente necesario para ejecutar la demo en Microsoft Fabric. No incluye mocks locales ni scripts de despliegue.

Para la preparacion detallada antes de grabar, usa primero:

```text
docs/PRE_RECORDING_DEPLOYMENT.md
```

## 1. Preparacion del workspace

Crear o reutilizar estos artefactos en Fabric:

- Workspace: `ws_frasohome`
- Lakehouse: `lh_frasohome`
- Carpeta de ficheros: `Files/bronze`
- Environment Spark publicado con:
  - `great_expectations`
  - Runtime compatible con Fabric AI Functions
- Modelo semantico sobre tablas `gold_*`
- Data Agent conectado al modelo semantico o a las tablas gold
- Fabric App / Rayfin preparada, si la preview esta habilitada en el tenant

No ejecutes despliegues desde este repo durante la preparacion de codigo.

## 2. Subir ficheros al Lakehouse

Subir los 11 CSV de `data/raw_csv` a:

```text
Files/bronze/
```

Subir el paquete Python a:

```text
Files/src/frasohome_fabric/
```

La estructura esperada en OneLake queda asi:

```text
Files/
  bronze/
    crm.csv
    devoluciones_online.csv
    devoluciones_tienda.csv
    fact_transacciones.csv
    lineas_pedido.csv
    pagos_tienda.csv
    pedidos.csv
    productos.csv
    stock_diario.csv
    tiendas.csv
    ventas_pos.csv
  src/
    frasohome_fabric/
      __init__.py
      ai_functions.py
      config.py
      gold.py
      io.py
      normalize.py
      quality.py
      silver.py
```

## 3. Importar notebooks

Importar estos notebooks en Fabric:

1. `notebooks/00_setup_fabric.ipynb`
2. `notebooks/01_bronze_ingesta_gx.ipynb`
3. `notebooks/02_silver_gold_ai_quality.ipynb`
4. `notebooks/03_features_scoring_semantic.ipynb`

Los `.py` equivalentes quedan como fuente versionable y como respaldo si prefieres copiar celdas manualmente.

Todos los notebooks asumen que existe este path:

```python
repo_src = "/lakehouse/default/Files/src"
```

Si usas otra carpeta, cambia esa variable en la primera celda de cada notebook.

## 4. Orden de ejecucion

### Notebook 00

Objetivo: comprobar que el Lakehouse tiene los CSV, que `great_expectations` esta instalado y que el paquete `frasohome_fabric` es importable.

Resultado esperado:

- Lista de ficheros en `Files/bronze`
- Version de Great Expectations
- Import correcto de `frasohome_fabric`

### Notebook 01

Objetivo: cargar bronze y mostrar calidad fallando de forma controlada.

Celdas importantes para grabacion:

- `display(crm.select(...))`: enseña el caos del dato.
- `crm.groupBy("tier_fidelizacion")`: enseña variantes como `GOLD`, `silver`, `VIP`, `N/A`.
- `validate_dataframe_with_suite(... "crm_bronze_contract" ...)`: debe fallar por tier.
- validacion de tiendas: debe detectar `S003` duplicada.

Mensaje en camara:

> No miro la calidad a ojo; la convierto en contrato ejecutable.

### Notebook 02

Objetivo: crear silver, usar AI Functions para limpieza semantica y construir la fact gold.

Celdas importantes:

- Transformaciones silver: regex y parseo para problemas sintacticos.
- `classify_tier(crm)`: requiere Fabric AI Functions.
- `classify_return_reason(...)`: clasifica texto libre de devoluciones.
- `build_gold_fact(...)`: une ventas online, POS y devoluciones.
- GX sobre `gold_fact_transacciones`: contrato ya sobre dato curado.

Si AI Functions no esta disponible, la celda debe fallar con un error explicito. No hay mock local.

### Notebook 03

Objetivo: crear features, scoring y tablas para app/agente.

Tablas generadas:

- `gold_cliente_features`
- `gold_producto_features`
- `gold_cliente_score`

El numero de clientes en riesgo depende de la formula final de scoring. Si necesitas clavar el numero narrativo de la slide, ajusta el umbral en `build_customer_score`.

## 5. SQL analytics endpoint

Ejecutar las consultas de:

```text
sql/validation_queries.sql
```

Usalas para contrastar las respuestas del Data Agent en pantalla.

## 6. Modelo semantico

Crear un modelo semantico sobre:

- `gold_fact_transacciones`
- `gold_cliente_score`
- `gold_producto_features`

Crear las medidas de:

```text
semantic_model/semantic_measures.dax
```

Recomendacion para la demo: ensena `Ventas netas`, `Margen bruto`, `Tasa devolucion` y `Clientes en riesgo`.

## 7. Data Agent

Crear un Data Agent sobre el modelo semantico o las tablas gold.

Usar como instrucciones:

```text
data_agent/instructions.md
```

Ensayar con:

```text
data_agent/expected_answers.md
```

Prompts de grabacion:

1. `Que categorias devuelven mas y como afecta al margen?`
2. `Comparame ventas netas y margen por canal.`
3. `Que clientes en riesgo conviene reactivar y con que oferta?`

## 8. Rayfin / Fabric App

El origen actualizado de la Fabric App desplegada como `frasohome-explorer` esta en:

```text
rayfin/
```

Este repo no ejecuta `rayfin up` ni crea despliegues durante la preparacion de codigo. El directorio `rayfin/` contiene el proyecto reproducible y sus instrucciones:

```text
rayfin/README.md
```

Piezas principales:

- `rayfin/fabric.yaml`: alias `frasohomeModel` con `workspaceId` e `itemId` del modelo semantico.
- `rayfin/rayfin/rayfin.yml`: configuracion del item Fabric App, auth, data y static hosting.
- `rayfin/rayfin/data/ReactivacionCliente.ts`: entidad de write-back para acciones de reactivacion.
- `rayfin/src/queries/frasohome/kpis.dax`: KPIs `Ventas netas`, `Margen bruto`, `Tasa devolucion` y `Clientes en riesgo`.
- `rayfin/src/queries/frasohome/risk-customers.dax`: top 25 clientes en riesgo filtrados por canal y categoria.
- `rayfin/src/App.tsx`: ejecucion de consultas y alta de `ReactivacionCliente`.

Comandos de validacion local, sin desplegar:

```powershell
cd rayfin
npm install
npm run test
npm run build
```

Comandos de despliegue, solo cuando quieras crear o actualizar el item Fabric App en el workspace destino:

```powershell
npx rayfin up --workspace-id <workspace-guid> --dry-run
npx rayfin up --workspace-id <workspace-guid>
```

## 9. Checklist de grabacion

- Bronze cargado.
- Environment publicado.
- Cluster Spark caliente.
- Notebook 01 sin ejecutar antes de grabar, para mostrar el fallo GX.
- Notebook 02 probado al menos una vez.
- Tablas gold creadas.
- Modelo semantico actualizado.
- Data Agent creado y probado.
- Rayfin preparado si la preview esta disponible.
