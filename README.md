# FraSoHome: app inteligente de retail multicanal en Microsoft Fabric

[![Microsoft Fabric](https://img.shields.io/badge/Microsoft%20Fabric-Lakehouse%20%2B%20AI-5B5FC7)](#)
[![PySpark](https://img.shields.io/badge/PySpark-Medallion%20pipeline-E25A1C)](#)
[![Great Expectations](https://img.shields.io/badge/Great%20Expectations-Data%20quality-FF5A5F)](#)
[![Tenerife Summer Sessions 2026](https://img.shields.io/badge/Tenerife%20Summer%20Sessions-2026-00897B)](#)

Repositorio de la demo **"App inteligente de retail multicanal con datos, scoring e IA"**, preparada para las **Tenerife Summer Sessions 2026**.

La historia: una cadena ficticia, **FraSoHome**, vende en tienda y online. Sus datos viven repartidos entre CRM, e-commerce, POS, devoluciones, pagos, catalogo y stock. Hay fechas en varios formatos, importes con euros y comas, IDs en mayusculas y minusculas, categorias incompletas, tiendas duplicadas y variantes como `Oro`, `GOLD`, `silver`, `VIP` o `N/A` para representar tiers de fidelizacion.

La demo convierte ese caos en un producto de datos gobernado en **Microsoft Fabric**:

```text
CSV crudo -> Bronze -> Silver -> Gold -> Features -> Scoring -> Modelo semantico -> App + Data Agent
```

La idea central es sencilla:

> La IA es la interfaz. El producto real es el dato confiable que la alimenta.

## Que se construye

Durante la demo se recorre el flujo completo:

1. **Ingesta bronze en OneLake**
   - 11 CSV aterrizados en `Files/bronze`.
   - Tablas `bronze_*` sin corregir, para preservar trazabilidad.

2. **Perfilado y contrato de calidad**
   - Validaciones con **Great Expectations** sobre Spark.
   - Fallos controlados en CRM y tiendas: tiers no canonicos y `store_id` duplicado.

3. **Limpieza silver**
   - Normalizacion sintactica con PySpark: IDs, fechas, importes, categorias y metodos de pago.
   - Normalizacion semantica con **Fabric AI Functions** para tiers y motivos de devolucion.

4. **Fact table gold**
   - Integracion de ventas POS, ventas online y devoluciones.
   - Movimientos con signo, linaje, canal, cliente, producto, margen y flags de calidad.

5. **Features y scoring**
   - Features de cliente: recencia, frecuencia, gasto, ticket medio y devoluciones.
   - Features de producto: ventas, margen, devoluciones y riesgo de stock.
   - Scoring 0-100 para detectar clientes en riesgo.

6. **Modelo semantico**
   - Medidas oficiales: `Ventas netas`, `Margen bruto`, `Tasa devolucion`, `Clientes en riesgo`.
   - Una sola definicion de metrica para Power BI, app y agente.

7. **Data Agent**
   - Preguntas en lenguaje natural sobre el modelo gobernado.
   - Recomendaciones accionables para reactivar clientes.

8. **Rayfin / Fabric App**
   - Codigo fuente de una app de exploracion y accion.
   - Write-back gobernado con la entidad `ReactivacionCliente`.
   - Esta parte depende de la disponibilidad de Fabric Apps / Rayfin en tu tenant.

## Arquitectura

```text
data/raw_csv
   |
   v
OneLake Files/bronze
   |
   v
bronze_* tables
   |
   |  Great Expectations
   v
silver_* tables
   |
   |  PySpark + Fabric AI Functions
   v
gold_fact_transacciones
gold_cliente_features
gold_producto_features
gold_cliente_score
   |
   +--> SQL analytics endpoint
   +--> Semantic model
   +--> Data Agent
   +--> Rayfin / Fabric App
```

## Estructura del repositorio

```text
data/raw_csv/                 Datos crudos de FraSoHome
sesion/                       Guion, resumen y presentacion
src/frasohome_fabric/         Codigo PySpark reutilizable para Fabric
notebooks/                    Notebooks Fabric en formato .py
sql/                          Consultas de validacion para SQL endpoint
semantic_model/               Medidas DAX sugeridas
data_agent/                   Instrucciones y respuestas esperadas del agente
rayfin/                       Codigo fuente de la Fabric App / Rayfin
docs/                         Runbooks de ejecucion y preparacion
```

## Requisitos

Para reproducir la demo necesitas:

- Un tenant con **Microsoft Fabric** habilitado.
- Un workspace con capacidad Fabric asignada.
- Permisos para crear Lakehouse, Notebooks, Environment, Semantic model y Data Agent.
- Un Lakehouse para cargar los CSV.
- Un Environment Spark con `great_expectations`.
- Fabric Runtime con **AI Functions** habilitadas si quieres ejecutar la limpieza semantica.
- Opcional: Fabric Apps / Rayfin si tu tenant tiene disponible esa preview.

> Nota sobre Rayfin: el guion de la sesion lo trata como funcionalidad preview. Si no esta disponible en tu tenant, puedes reproducir toda la parte de datos, modelo semantico y Data Agent, y revisar el codigo de `rayfin/` como referencia de app.

## Inicio rapido para asistentes

Estas instrucciones son para quien quiera reproducir la demo en su propio tenant despues de la sesion.

### 1. Crear workspace y Lakehouse

En Fabric:

```text
Workspace recomendado: ws_frasohome
Lakehouse recomendado: lh_frasohome
```

Asigna una capacidad Fabric al workspace antes de ejecutar notebooks.

### 2. Subir los CSV

En el Lakehouse, crea:

```text
Files/bronze
```

Sube todos los ficheros de:

```text
data/raw_csv/
```

Debe quedar asi:

```text
Files/bronze/crm.csv
Files/bronze/devoluciones_online.csv
Files/bronze/devoluciones_tienda.csv
Files/bronze/fact_transacciones.csv
Files/bronze/lineas_pedido.csv
Files/bronze/pagos_tienda.csv
Files/bronze/pedidos.csv
Files/bronze/productos.csv
Files/bronze/stock_diario.csv
Files/bronze/tiendas.csv
Files/bronze/ventas_pos.csv
```

### 3. Subir el codigo comun

Sube la carpeta:

```text
src/frasohome_fabric/
```

a:

```text
Files/src/frasohome_fabric/
```

Los notebooks esperan esta ruta:

```python
repo_src = "/lakehouse/default/Files/src"
```

Si usas otro Lakehouse o ruta, cambia esa variable en la primera celda de cada notebook.

### 4. Crear el Environment

Crea un Environment Spark, por ejemplo:

```text
env_frasohome_demo
```

Instala y publica:

```text
great_expectations
```

Adjunta ese Environment y el Lakehouse a todos los notebooks.

### 5. Importar los notebooks

Crea cuatro notebooks en Fabric a partir de:

```text
notebooks/00_setup_fabric.py
notebooks/01_bronze_ingesta_gx.py
notebooks/02_silver_gold_ai_quality.py
notebooks/03_features_scoring_semantic.py
```

Ejecutalos en este orden:

```text
00_setup_fabric
01_bronze_ingesta_gx
02_silver_gold_ai_quality
03_features_scoring_semantic
```

### 6. Validar resultados

Abre el SQL analytics endpoint del Lakehouse y ejecuta:

```text
sql/validation_queries.sql
```

Resultados aproximados esperados:

```text
Ventas:              ~1,79 M EUR
Devoluciones:        ~137 k EUR
Tasa devolucion:     ~7,6 %
Margen bruto:        ~648 k EUR
Canal principal:     POS
```

Los numeros pueden variar ligeramente si ajustas el pipeline o la formula de scoring.

### 7. Crear el modelo semantico

Crea un modelo semantico con estas tablas:

```text
gold_fact_transacciones
gold_cliente_score
gold_producto_features
silver_crm
silver_productos
silver_tiendas
```

Anade las medidas de:

```text
semantic_model/semantic_measures.dax
```

Medidas principales:

```text
Ventas netas
Importe devoluciones
Tasa devolucion
Margen bruto
Clientes en riesgo
Ticket medio
```

### 8. Crear el Data Agent

Crea un Data Agent sobre el modelo semantico o, si tu tenant no lo permite, sobre las tablas gold.

Pega como instrucciones:

```text
data_agent/instructions.md
```

Prueba estos prompts:

```text
Que categorias devuelven mas y como afecta al margen?
Comparame ventas netas y margen por canal.
Que clientes en riesgo conviene reactivar y con que oferta?
```

Usa:

```text
data_agent/expected_answers.md
```

para comparar la forma esperada de las respuestas.

### 9. Opcional: Rayfin / Fabric App

El codigo de referencia esta en:

```text
rayfin/
```

Contiene:

```text
rayfin/src/data/ReactivacionCliente.ts
rayfin/src/app/App.tsx
rayfin/src/app/styles.css
```

La app esta pensada para:

- Leer KPIs y clientes en riesgo desde gold/modelo semantico.
- Mostrar filtros por canal y categoria.
- Permitir anadir clientes a una campania de reactivacion.
- Escribir la accion en la entidad `ReactivacionCliente`.

No ejecutes comandos de despliegue sin revisar antes la disponibilidad de Rayfin/Fabric Apps en tu tenant.



## Datos incluidos

El dataset es ficticio y esta orientado a demo. Incluye:

- `103` clientes CRM.
- `101` productos.
- `8` tiendas, con una duplicidad intencionada.
- `656` pedidos online.
- `1.949` lineas de pedido.
- `2.521` lineas POS.
- `435` devoluciones entre online y tienda.
- `1.940` registros de stock.
- Una fact de referencia con `4.973` movimientos.

Problemas de calidad intencionados:

- Tiers de fidelizacion no canonicos.
- Fechas en varios formatos.
- Importes como texto, con `€` y coma decimal.
- IDs con casing inconsistente.
- Categorias vacias o con variantes.
- Devoluciones con motivos en texto libre.
- Tienda duplicada.

## Filosofia de la demo

Esta demo no intenta ensenar "un agente conectado a tablas". Intenta mostrar lo que debe existir antes:

- Contrato de datos.
- Calidad ejecutable.
- Modelo gold gobernado.
- Metricas oficiales.
- Accion de negocio trazable.

El agente llega al final porque solo entonces tiene algo fiable que preguntar.
