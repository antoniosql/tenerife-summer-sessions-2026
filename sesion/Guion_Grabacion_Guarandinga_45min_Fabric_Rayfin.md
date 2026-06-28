# Guion de grabación · App inteligente de retail multicanal con datos, scoring e IA
## Versión Microsoft Fabric + app Rayfin

**Evento:** Tenerife Summer Sessions 2026 · GuarandingaTECH
**Ponente:** Antonio Soto
**Formato:** grabación, 45 min, ~60 % demo práctica
**Caso:** FraSoHome (cadena ficticia de retail omnicanal)
**Stack:** Microsoft Fabric (Lakehouse + Notebooks + modelo semántico + Data Agent) y **Rayfin** (Fabric App) como app de exploración y activación.

---

## 1. Reparto de tiempo

| Bloque | Slides | Min | Acumulado |
|---|---|---|---|
| Apertura y caso | 1–4 | 5 | 0:00–5:00 |
| El problema y el plan | 5–7 | 4 | 5:00–9:00 |
| Divisoria · Manos a la obra | 8 | 1 | 9:00–10:00 |
| **Demo 1** · Ingesta + perfilado con **Great Expectations** | 9 | 7 | 10:00–17:00 |
| **Demo 2** · Limpieza (**AI Functions** + GX) + fact table | 10 | 8 | 17:00–25:00 |
| **Demo 3** · Features + scoring + modelo semántico | 11 | 5 | 25:00–30:00 |
| **Demo 4** · App de exploración con **Rayfin** | 12 | 7 | 30:00–37:00 |
| **Demo 5** · Data Agent: NL + recomendaciones | 13 | 6 | 37:00–43:00 |
| Recap, producción y cierre | 14–16 | 2 | 43:00–45:00 |

Demo total ≈ 33 min.

---

## 2. Qué es Rayfin (para situarlo en cámara, 1 frase)

> Rayfin es el SDK y CLI open-source que Microsoft presentó en **Build 2026**: defines el backend de una app (modelos de datos, APIs, identidad y políticas de acceso) **en código** y lo despliegas en Microsoft Fabric con un comando. La app corre como **artefacto nativo de Fabric**, su dato vive en **OneLake** y la autenticación es **Entra ID (SSO)**. Es decir: una app de negocio que nace ya gobernada, sobre el mismo dato que el resto de Fabric.

Estado: **preview** (julio 2026), disponible por regiones, requiere activar *Fabric Apps* en el portal de administración. Dilo en cámara para fijar expectativas.

---

## 2-bis · Arquitectura de calidad del dato (el "peso" de la demo)

En lugar de regex + filtros ad-hoc, la calidad se reparte en tres capas con responsabilidades distintas:

| Capa | Herramienta | Para qué |
|---|---|---|
| **Sintáctica** | Regex / casing (`initcap`, `trim`, `regexp_replace`) | Formato: €, coma decimal, mayúsculas, espacios. Determinista y barato. |
| **Semántica** | **AI Functions** (`ai_classify`, `ai_similarity`, `ai_extract`) | Significado: 12 *tiers* → 4 niveles, motivos de devolución en texto libre, dedupe difuso. Lo que la regex no puede. |
| **Contrato** | **Great Expectations** (GX Core en Spark) | Validar y **gobernar**: suites declarativas que corren, fallan/cuarentenan y dejan traza (JSON + Data Docs) en cada capa del medallion. |

> **Idea de fondo para la sesión:** la regex *limpia*, las AI Functions *entienden*, y Great Expectations *gobierna*. La calidad deja de ser un paso de limpieza y se convierte en una **puerta**: si la suite no está verde, el dato no sube a gold y el agente no pregunta. Esto refuerza directamente la Slide 15 ("calidad ejecutable que deja traza").

**Otras opciones nativas de Fabric (menciónalas, no las demuestres):** *Purview Data Quality* (reglas no-code, perfilado y recomendaciones con IA, scorecards desde el Unified Catalog), *materialized lake views* con constraints en T-SQL, y validaciones de pipeline en *Data Factory*. Para una demo en notebook, GX + AI Functions es lo que más peso da sin cambiar de superficie.

---

## 3. ⚠️ Preparación previa imprescindible ("cocina hecha")

Fabric y Rayfin **no se pueden ejecutar en frío** en 45 minutos (arranque de Spark, aprovisionamiento del Lakehouse, primer `rayfin up`). Graba en modo *cooking show*: ingredientes preparados, montaje en directo.

**Antes de grabar deja hecho:**
- [ ] Workspace de Fabric con **capacity** asignada (trial o F SKU) y *Fabric Apps (preview)* habilitado en el tenant.
- [ ] **Lakehouse `lh_frasohome`** creado. Los 11 CSV ya **aterrizados en `Files/bronze/`** (OneLake).
- [ ] **Environment de Spark** con `great_expectations` añadido en *Public libraries* y **publicado** (la primera publicación tarda; déjalo hecho). Notebooks adjuntados a ese Environment.
- [ ] **AI Functions habilitadas**: tenant switch de *Copilot / Azure OpenAI* activado y, según región, el de *cross-geo processing*. Notebook en **Runtime 1.3+**.
- [ ] **Notebook 1 (ingesta/perfilado + GX)** con celdas escritas, *sin ejecutar* (las corres en vivo; clúster ya "caliente"). Suite GX `crm_bronze` lista (la dejas fallar en directo).
- [ ] **Notebook 2 (silver/gold + AI Functions + GX)** escrito; tablas `silver_*` y `gold_*` **ya generadas una vez** (para validar; en vivo reejecutas 2–3 celdas clave). Prueba antes que `ai_classify` responde para no perder tiempo de modelo en cámara.
- [ ] **Modelo semántico** sobre gold con medidas oficiales (Ventas netas, Margen bruto, Tasa de devolución) ya creado y, opcional, un **informe Power BI** mínimo.
- [ ] **App Rayfin** ya **scaffolded y desplegada una vez** (`rayfin up` en frío hecho de antemano). En vivo solo muestras un cambio incremental + `rayfin up` rápido.
- [ ] **Data Agent** ya creado y apuntando al modelo semántico / gold, con 2–3 instrucciones de dominio cargadas.
- [ ] Node 20+, `npm`, sesión `npx rayfin login` ya válida. Fuente del editor/terminal a 16–18 pt.

---

## 4. Guion por bloques

### Slide 1 · Portada (0:00–0:40)
> "Hola, bienvenid@s a Tenerife Summer Sessions. En 45 minutos vamos a coger los datos de una cadena de retail ficticia —repartidos y sucios— y los convertimos, **en Microsoft Fabric**, en un producto de datos con scoring, una app de negocio con Rayfin y un agente que responde en lenguaje natural."

### Slide 2 · Quién soy (0:40–1:20)
Una frase: 20+ años aterrizando plataformas de datos e IA. *Sustituye la foto de la plantilla por la tuya.*

### Slide 3 · Del caos a la app (1:20–2:30)
> "La tentación al llegar la IA es enchufar un agente a las tablas y preguntar. El problema no es la IA: es que el dato está fragmentado y sucio. Veremos qué tiene que existir **antes** de dejar preguntar en lenguaje natural."

### Slide 4 · El caso FraSoHome (2:30–5:00)
> "Vende en tienda y online. Su dato vive en siete sitios: CRM, e-commerce, POS, devoluciones online y de tienda, pagos, catálogo y stock. Ninguno se habla con el otro." Escala: ~657 pedidos online, ~2.500 líneas POS, ~100 clientes, ~100 productos, 8 tiendas (una duplicada).

### Slide 5 · El problema no es la IA, es el dato (5:00–7:00)
Apóyate en las tres cifras: **11** fuentes sin integrar; **12** variantes de *tier* para 4 niveles reales (Oro, oro, GOLD, silver, VIP, N/A…); **5+** formatos de fecha, importes con € y comas, e IDs en mayúsculas y minúsculas.
> "Si conectas un agente aquí, te da dos respuestas distintas a la misma pregunta."

### Slide 6 · Lo que construiremos en 45 min (7:00–8:30)
Recorre el roadmap: ingesta y perfilado → limpieza → fact integrada → features + scoring → app de exploración (Rayfin) → IA accionable (Data Agent).

### Slide 7 · Idea clave (8:30–9:00)
> "La IA es la interfaz. El producto real es el dato confiable que la alimenta."

### Slide 8 · Manos a la obra (9:00–10:00)
Cambia a Fabric. Enseña el **workspace `ws_frasohome`** con el Lakehouse, los notebooks, el modelo semántico, la app Rayfin y el Data Agent ya en su sitio.
> "Todo esto vive en un único workspace gobernado. Vamos pieza a pieza."

---

## DEMO 1 · Ingesta y perfilado de calidad (Slide 9 · 10:00–17:00)
**En Fabric:** Lakehouse `lh_frasohome` + Notebook 1. El perfilado deja de ser `value_counts` ad-hoc y pasa a ser un **contrato ejecutable con Great Expectations (GX)**.

> *Mensaje que repites en cámara: "No voy a 'mirar' la calidad. La voy a **medir con reglas que corren y dejan traza**." Eso es lo que separa una demo de un producto.*

**Paso 1 — Bronze en OneLake.** Muestra los 11 CSV en `Files/bronze/`.
> "Esto es bronze: capturo la fuente tal cual, sin corregir nada. Trazabilidad antes que limpieza."

**Paso 2 — Cargar y enseñar el caos con Data Wrangler (visual en cámara).**
```python
import pandas as pd
from notebookutils import mssparkutils
base = "/lakehouse/default/Files/bronze"
raw = {f.name.replace('.csv',''): pd.read_csv(f"{base}/{f.name}", dtype=str, keep_default_na=False)
       for f in mssparkutils.fs.ls("Files/bronze")}
```
Abre `raw['ventas_pos']` en **Data Wrangler** (*Launch Data Wrangler*). Señala el perfil de columnas (nulos, distribución) y el caso `customer_id`=`c0030`, `importe_linea`=`221,53`, `descuento_importe`=`€59.62`.

**Paso 3 — Perfilado como contrato: Great Expectations.**
GX **no es un módulo nativo de Fabric**: es la librería open-source **GX Core** que añades a un **Environment de Spark** (*Public libraries → great_expectations → Publish*) y ejecutas vía PySpark. Eso ya lo tienes hecho. En el notebook:
```python
import great_expectations as gx
ctx = gx.get_context()

# Suite de expectativas sobre la fuente CRM (bronze)
suite = ctx.suites.add(gx.ExpectationSuite(name="crm_bronze"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="customer_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column="customer_id"))
suite.add_expectation(gx.expectations.ExpectColumnValuesToMatchRegex(
        column="email", regex=r"^[^@]+@[^@]+\.[^@]+$", mostly=0.90))   # tolera 10 % nulos/erróneos
suite.add_expectation(gx.expectations.ExpectColumnValuesToBeInSet(
        column="tier_fidelizacion", value_set=["Oro","Plata","Bronce","Platino"]))  # ← va a FALLAR

# Validar el batch de Spark contra la suite
ds  = ctx.data_sources.add_spark(name="lh")
val = ds.add_dataframe_asset(name="crm").add_batch_definition_whole_dataframe("b") \
        .get_batch(batch_parameters={"dataframe": spark.createDataFrame(raw['crm'])})
res = val.validate(suite)
print(res.describe())     # JSON con expectativas OK / KO y filas afectadas
```
**Narración (el momento clave):**
> "Mirad la última expectativa: el tier solo puede ser Oro, Plata, Bronce o Platino. **Falla**, porque en el dato real hay doce variantes —GOLD, silver, oro, VIP, N/A…—. Esto no es un warning que se me escapa: es una regla que corre, falla y deja un resultado auditable. La duda es: ¿cómo lo arreglo? Con regex **no**, porque 'GOLD' no es un problema de mayúsculas: es un problema de **significado**. Eso lo resolvemos en la Demo 2 con AI Functions."

> *Tip: enseña los **Data Docs** de GX (HTML) o el JSON de `res` con las expectativas en rojo. Una pantalla con la regla fallando vale más que mil `value_counts`.*

---

## DEMO 2 · Limpieza y fact table integrada (Slide 10 · 17:00–25:00)
**En Fabric:** Notebook 2 → silver y gold (Delta). Aquí está el reparto de la limpieza: **regex para lo sintáctico, AI Functions para lo semántico, GX para volver a validar.**

**Paso 1 — Lo sintáctico con regex (lo trivial, no le des bombo):**
```python
import pyspark.sql.functions as F
def n_num(c):  return F.regexp_replace(F.regexp_replace(F.regexp_replace(c,"€","")," ",""),",",".").cast("double")
def n_id(c):   return F.upper(F.trim(c))     # C0001 vs c0001
def n_cat(c):  return F.initcap(F.trim(c))   # 'muebles ' -> 'Muebles'
```
> "El símbolo del euro, la coma decimal y las mayúsculas son problemas de **forma**. Una regex y listo. Pero hay problemas de **fondo** que la regex no puede tocar."

**Paso 2 — Lo semántico con AI Functions (el upgrade de calidad).**
`initcap` arregla `oro→Oro`, pero **no** sabe que `GOLD`, `silver` o `VIP` son esos mismos niveles: eso es significado, no formato. Lo resuelve `ai_classify`, que mapea texto libre a un conjunto canónico. *(AI Functions: Fabric Runtime 1.3+, gpt-5-mini por defecto; requiere el tenant switch de Copilot/Azure OpenAI. Confirma la firma exacta en la doc, evoluciona con el runtime.)*

Opción notebook (PySpark/pandas, accesor `.ai`):
```python
crm = spark.createDataFrame(raw['crm'])
crm = crm.ai.classify(input_col="tier_fidelizacion",
                      labels=["Oro","Plata","Bronce","Platino"],
                      output_col="tier_norm")
# motivo_devolucion en texto libre -> categorías accionables
dev = spark.createDataFrame(raw['devoluciones_online'])
dev = dev.ai.classify(input_col="motivo_devolucion",
                      labels=["Talla/medidas","Defecto","No cumple expectativa","Cambio de opinión","Logística"],
                      output_col="motivo_norm")
```
Opción T-SQL (en el SQL analytics endpoint / Warehouse, para la capa curada):
```sql
SELECT customer_id,
       ai_classify(tier_fidelizacion, 'Oro','Plata','Bronce','Platino') AS tier_norm
FROM silver_crm;
```
**Narración:**
> "Doce variantes a cuatro niveles, sin escribir un diccionario a mano y sin que se me escape ningún caso raro. Y de paso clasifico los motivos de devolución de texto libre en categorías que negocio puede accionar. Esto la regex no lo hace."

> *Honestidad técnica (dilo en cámara): AI Functions tiene coste por llamada al modelo, no es determinista y está optimizado para inglés. Para conjuntos finitos y conocidos, a veces prefieres un diccionario de mapeo reproducible; reserva `ai_classify` para lo genuinamente difuso o de texto libre. Para deduplicar clientes parecidos, `ai_similarity` es la herramienta.*

**Paso 3 — Fact integrada (gold).** Une ventas POS + online + devoluciones en un único hecho con **signo** (venta +, devolución −) y metadatos de origen:
```python
fact = (ventas_pos_norm.unionByName(ventas_online_norm).unionByName(devoluciones_norm))
fact.write.mode("overwrite").format("delta").saveAsTable("gold_fact_transacciones")
```

**Paso 4 — Cerrar el contrato: re-ejecutar GX en verde.**
Vuelve a correr la suite `crm` (ahora sobre `tier_norm`) y la nueva suite de la `gold_fact` (grano único, importes en rango, sin huérfanos):
```python
gold_suite = ctx.suites.add(gx.ExpectationSuite(name="gold_fact"))
gold_suite.add_expectation(gx.expectations.ExpectColumnValuesToBeInSet(
        column="tipo", value_set=["VENTA","DEVOLUCION"]))
gold_suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column="fecha_movimiento"))
gold_suite.add_expectation(gx.expectations.ExpectColumnValuesToBeBetween(
        column="importe_abs", min_value=0, max_value=50000))
# validar -> ahora TODO en verde
```
**Narración (el cierre del arco de calidad):**
> "La misma regla que fallaba en bronze ahora pasa. Esto es lo importante: la calidad **no es un paso de limpieza, es una puerta**. Si la suite no está verde, el dato no sube a gold y el agente no pregunta. **Calidad sin ejecución es documentación; calidad con ejecución es contrato.**"

**Paso 5 — Validar métricas oficiales (SQL analytics endpoint):**
```sql
SELECT SUM(CASE WHEN tipo='VENTA' THEN importe END)                  AS ventas_netas,   -- ~1.777.000
       SUM(CASE WHEN tipo='DEVOLUCION' THEN ABS(importe) END)        AS devoluciones,   -- ~137.000
       SUM(CASE WHEN tipo='DEVOLUCION' THEN ABS(importe) END)*1.0 /
       SUM(CASE WHEN tipo='VENTA' THEN importe END)                  AS tasa_devolucion -- 0,077
FROM gold_fact_transacciones;
```
> "1,78 millones en ventas netas, 7,7 % de devoluciones. **Un solo número, no dos.**"

> *El dataset trae `fact_transacciones.csv` ya integrado (4.973 filas, 59 columnas de linaje). Constrúyelo en vivo simplificado y di "en el repo está la versión completa".*

---

## DEMO 3 · Features, scoring y modelo semántico (Slide 11 · 25:00–30:00)
**En Fabric:** Notebook 2 (continuación) → tablas gold de features/score; **modelo semántico** con medidas oficiales.

**Paso 1 — Features de cliente y producto (gold):**
```python
# Cliente: recencia, frecuencia, gasto, ticket medio, tasa de devolución
gold_cliente = spark.sql("""
  SELECT customer_id_std AS customer_id,
         SUM(importe)                          AS gasto,
         COUNT(*)                              AS pedidos,
         MAX(fecha_movimiento)                 AS ult_compra
  FROM gold_fact_transacciones
  WHERE tipo='VENTA' AND flag_customer_in_crm = 1
  GROUP BY customer_id_std
""")
# Producto: margen, % devolución, riesgo de rotura (stock_cierre < stock_minimo)
```

**Paso 2 — Scoring 0–100 (RFM-lite) y clientes en riesgo:**
```python
from pyspark.sql.window import Window
# normaliza gasto/recencia/pedidos/tasa_dev a 0..1 y combínalos 0.4/0.3/0.2/0.1 -> score*100
gold_cliente_score.createOrReplaceTempView("v")
spark.sql("SELECT COUNT(*) FROM v WHERE recencia_dias > 120 AND score < 40").show()  # 94
gold_cliente_score.write.mode("overwrite").saveAsTable("gold_cliente_score")
```
> "94 clientes en riesgo de fuga. Esto es lo que vamos a poder accionar en la app."

**Paso 3 — Modelo semántico (el contrato para app, Power BI y agente).**
Sobre las tablas gold, crea/abre el **modelo semántico** y enseña las **medidas oficiales** en DAX:
```dax
Ventas netas    = CALCULATE(SUM(fact[importe]), fact[tipo]="VENTA")
Margen bruto    = CALCULATE(SUM(fact[margen]),  fact[tipo]="VENTA")
Tasa devolución = DIVIDE(
                    CALCULATE(SUM(fact[importe_abs]), fact[tipo]="DEVOLUCION"),
                    [Ventas netas])
```
> "Una sola definición oficial de cada métrica. A partir de aquí, **la app de Rayfin, Power BI y el agente van a hablar todos contra este modelo.** El mismo gobierno para los tres."

---

## DEMO 4 · App de exploración con Rayfin (Slide 12 · 30:00–37:00)
**Objetivo:** una app de negocio, gobernada y nativa de Fabric, donde negocio **explora** el score y **acciona** (marca clientes para campaña). Construida con **Rayfin**.

> *Recordatorio de grabación: el primer `rayfin up` (frío) ya está hecho. En vivo muestras el proyecto, un cambio de modelo y un `up` incremental.*

**Paso 1 — El proyecto Rayfin.** Abre el proyecto ya scaffolded (recuerda cómo se crea):
```bash
# (hecho de antemano) scaffold con plantilla Data App
npm create @microsoft/rayfin@latest -- frasohome-explorer --workspace ws_frasohome
cd frasohome-explorer
```
Enseña la estructura: `rayfin/data` (modelos TypeScript), la API GraphQL generada, y el frontend React.

**Paso 2 — El modelo de datos en código (lo que hace a la app gobernada).** En `rayfin/data`, muestra una entidad que representa la **acción de negocio** (marcar cliente en campaña). Esta es la pieza que **escribe en OneLake**:
```typescript
import { entity, role, text, integer, boolean, date, uuid } from '@microsoft/rayfin-core';

@entity()
@role('authenticated', '*')           // solo usuarios Entra del tenant
export class ReactivacionCliente {
  @uuid()    id!: string;
  @text()    customer_id!: string;     // viene del score gold
  @integer() score!: number;
  @text()    categoria_top!: string;
  @text()    oferta_sugerida!: string;
  @boolean() en_campania!: boolean;
  @date()    creado_el!: Date;
}
```
> "Defino el dato y el acceso **en código**. Al desplegar, Rayfin me genera la base de datos en Fabric, la API GraphQL, la autenticación con Entra y el hosting. Y lo que esta app escribe **aterriza en OneLake**, disponible para el resto de Fabric sin pipelines."

**Paso 3 — La pantalla.** El frontend React consulta vía **GraphQL**:
- **KPIs** arriba (Ventas netas, Margen, Tasa de devolución) — los mismos del modelo semántico.
- **Filtros**: canal (POS/ONLINE), categoría, tienda, fechas.
- **Tabla de clientes** ordenada por `score`, con los **94 en riesgo** resaltados.
- **Botón "Añadir a campaña de reactivación"** → escribe un `ReactivacionCliente` (write-back gobernado a OneLake).

**Paso 4 — Despliegue incremental en directo:**
```bash
npx rayfin up            # compila frontend, aplica cambios de esquema y publica en Fabric
# (si solo cambió el modelo de datos)
npx rayfin up db apply
```
Al terminar, el CLI imprime la **URL pública de la app** y el enlace al **artefacto en el portal de Fabric**. Ábrelo: enseña la app corriendo con **login Entra (SSO)** y la app como ítem hijo en el workspace, con su SQL Database.
> "Sin montar infraestructura: una app de empresa, con identidad y gobierno por defecto, sobre el mismo dato que acabamos de modelar."

---

## DEMO 5 · IA en lenguaje natural + recomendaciones (Slide 13 · 37:00–43:00)
**En Fabric:** **Data Agent** sobre el modelo semántico / gold (no sobre las tablas crudas).

**Idea clave a verbalizar:** el agente **no** ve bronze. Ve el modelo semántico, con métricas oficiales y permisos. Eso es lo que evita las "dos respuestas".

**Paso 1 — Pregunta de negocio (devoluciones y margen):**
> *"¿Qué categorías devuelven más y cómo afecta al margen?"*

En el Data Agent (o embebido en la app Rayfin), enséñalo. Responde con números reales: una vez unificada la categoría, Muebles concentra la mayor tasa de devolución.

**Paso 2 — Comparativa por canal:**
> *"Compárame ventas netas y margen por canal frente al mes anterior."* → POS ≈ 1,04 M€, ONLINE ≈ 0,74 M€.

**Paso 3 — Recomendación accionable (cierre potente):**
> *"¿Qué clientes en riesgo conviene reactivar y con qué oferta?"*

El agente cruza `gold_cliente_score` (94 en riesgo) con la categoría preferida y propone una oferta concreta. **Y ese resultado lo puedes empujar a la app Rayfin** (Paso 4 de la Demo 4: marcar en campaña). Ahí cierra el círculo dato → modelo → agente → acción.

**Paso 4 — Validar (genera confianza en cámara).** Pon al lado la respuesta del agente y la consulta SQL sobre gold. Mismo número.
> "El agente responde sobre la misma métrica oficial que la app y que Power BI. Cuatro superficies, un solo modelo gobernado. Si conectáramos esto a las tablas crudas, no podríamos confiar."

---

### Slide 14 · Lo que hemos construido (43:00–43:40)
> "En 45 minutos hemos ido del CSV crudo a un Lakehouse con medallion, una fact integrada, features y scoring, un modelo semántico, una app de negocio con Rayfin y un agente que responde y recomienda. Todo en un workspace gobernado."

### Slide 15 · De la demo a producción (43:40–44:30)
> "Una demo no es producción. Tres saltos: **contrato de datos antes que IA** (fuente, grano, propietario, SLA); **calidad ejecutable** (reglas que corren y dejan traza); y **métricas gobernadas** (una sola definición oficial, con RLS/CLS). En Fabric eso es medallion + modelo semántico + Data Agent, y la app sobre el mismo dato con Rayfin."

### Slide 16 · Gracias (44:30–45:00)
> "La IA es la interfaz; el producto real es el dato confiable. Soy Antonio Soto, me tenéis en @antoniosql y en la newsletter Dataging. ¿Preguntas?"

---

## 5. Mapa rápido demo ↔ artefacto Fabric

| Demo | Artefacto(s) en Fabric |
|---|---|
| 1 · Ingesta + perfilado | Lakehouse (`Files/bronze`), Notebook, Data Wrangler, **Great Expectations** (GX Core en Environment de Spark) |
| 2 · Limpieza + fact | Notebook (Spark): regex sintáctica + **AI Functions** (`ai_classify` / `ai_similarity`), tablas Delta silver/gold, **GX** como puerta, SQL analytics endpoint |
| 3 · Features + scoring | Notebook, tablas gold, **modelo semántico** (medidas DAX) |
| 4 · App de exploración | **Rayfin / Fabric App** (modelos TS, GraphQL, React, Entra SSO, SQL DB, OneLake write-back) |
| 5 · IA NL + recomendaciones | **Data Agent** sobre el modelo semántico |

## 6. Checklist antes de grabar
- [ ] Workspace + capacity + *Fabric Apps (preview)* habilitado.
- [ ] Lakehouse con los 11 CSV en `Files/bronze/`; clúster Spark "caliente".
- [ ] Environment con `great_expectations` publicado; AI Functions habilitadas (tenant switch) y Runtime 1.3+.
- [ ] Notebooks escritos; silver/gold ya generadas una vez para validar. Suite GX `crm_bronze` lista para fallar en directo; `ai_classify` probado.
- [ ] Modelo semántico con medidas oficiales (e informe Power BI mínimo, opcional).
- [ ] App Rayfin scaffolded y con un `rayfin up` en frío ya hecho; `rayfin login` válido.
- [ ] Data Agent creado y con instrucciones de dominio.
- [ ] Foto del ponente en Slide 2; captura real de la app Rayfin en Slide 12.
- [ ] Ensayo cronometrado. Si pasas de 45: enseña menos expectativas GX (no quites la pieza) y deja 2 prompts en Demo 5.

## 7. Cifras de seguridad
- Ventas netas ≈ **1,78 M€** · Margen bruto ≈ **648 k€** · Devoluciones ≈ **137 k€** (**7,7 %**).
- Canal: POS ≈ 1,04 M€ · ONLINE ≈ 0,74 M€.
- Categorías reales tras limpieza: **4** · Tiers reales: **4** (vs 12 en crudo).
- Clientes en riesgo de fuga: **94**.
- Hecho integrado: **4.973** movimientos (4.522 ventas + 451 devoluciones).

## 8. Notas sobre Rayfin (por si preguntan)
- Open-source (MIT), CLI + SDK; `npm create @microsoft/rayfin@latest`, despliegue con `npx rayfin up`.
- Backend definido en TypeScript con decoradores; genera SQL Database en Fabric, API GraphQL, cliente tipado y hosting estático.
- Autenticación **exclusivamente** Entra ID (Fabric SSO): no hay acceso anónimo ni invitados; para portales externos sigue siendo Power BI Embedded.
- El dato de la app vive en **OneLake** → disponible para Power BI, notebooks y Data Agents sin ETL adicional.
- **Preview** (julio 2026), por regiones; requiere habilitar *Fabric Apps* en administración. Partner de lanzamiento: Replit.
