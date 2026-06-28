# Despliegue previo a la grabacion

Guia operativa para dejar preparada la demo FraSoHome en Microsoft Fabric antes de empezar a grabar.

Fecha de referencia: 28 de junio de 2026. El guion menciona Rayfin / Fabric Apps como preview de julio de 2026; verifica disponibilidad real en tu tenant y region antes de comprometer esa parte en directo.

## Objetivo

Llegar al momento de grabacion con:

- Workspace y Lakehouse creados.
- CSV cargados en OneLake.
- Environment Spark publicado con `great_expectations` y AI Functions habilitadas.
- Notebooks importados, adjuntos y probados.
- Tablas bronze/silver/gold ya creadas al menos una vez.
- Modelo semantico con medidas oficiales.
- Data Agent creado y probado contra gold/modelo semantico.
- Rayfin/Fabric App preparado si la preview esta disponible.

La grabacion debe ser tipo cooking show: en directo se reejecutan celdas clave, no se aprovisiona todo desde cero.

## 1. Tenant y capacidad

Haz esto antes de entrar al workspace de la demo.

1. Confirma que tienes una capacidad Fabric asignable al workspace.
   - Trial o F SKU sirve para la demo.
   - Evita capacidad compartida o saturada: el arranque de Spark puede comerse varios minutos.

2. En el portal de administracion de Fabric, valida estos switches:
   - Fabric habilitado para el tenant.
   - OneLake habilitado.
   - Copilot / Azure OpenAI features habilitadas para AI Functions.
   - Cross-geo processing habilitado si tu region lo requiere para AI Functions.
   - Fabric Apps / Rayfin habilitado si esta disponible en tu tenant.

3. Confirma permisos:
   - Tu usuario debe ser Admin o Member del workspace.
   - Debes poder crear Lakehouses, Notebooks, Semantic models, Data Agents y Fabric Apps.
   - Si vas a mostrar SSO, entra con el mismo usuario que usara la app.

Checkpoint:

```text
Puedo crear notebooks, ejecutar Spark y ver la opcion de Data Agent / Fabric Apps en el workspace.
```

## 2. Workspace

Crear workspace:

```text
Nombre recomendado: ws_frasohome
Dominio: demo / Tenerife Summer Sessions 2026
Capacity: asignada desde el primer momento
```

Configuracion recomendada:

- Sensitivity label: interna/demo, si tu organizacion lo exige.
- Contact list: tu usuario.
- Git integration: opcional. Para grabar, mejor evitar commits o syncs durante la demo.

Checkpoint:

```text
El workspace abre rapido y muestra capacidad asignada.
```

## 3. Lakehouse y ficheros bronze

Crear Lakehouse:

```text
Nombre: lh_frasohome
```

En el Lakehouse, crear la carpeta:

```text
Files/bronze
```

Subir estos ficheros desde `data/raw_csv`:

```text
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
```

Subir tambien el paquete comun:

```text
Files/src/frasohome_fabric/
```

Debe contener:

```text
__init__.py
ai_functions.py
config.py
gold.py
io.py
normalize.py
quality.py
silver.py
```

Validacion visual:

- Abre `Files/bronze` y confirma 11 CSV.
- Abre `Files/src/frasohome_fabric` y confirma 8 `.py`.

Checkpoint:

```text
El notebook puede importar from frasohome_fabric.config import RAW_TABLES.
```

## 4. Environment Spark

Crear un Environment para la demo:

```text
Nombre: env_frasohome_demo
Runtime: Fabric Runtime compatible con AI Functions
```

Instalar libreria publica:

```text
great_expectations
```

Publicar el Environment. La publicacion puede tardar; no la hagas por primera vez en grabacion.

Adjuntar este Environment a los notebooks:

- `00_setup_fabric`
- `01_bronze_ingesta_gx`
- `02_silver_gold_ai_quality`
- `03_features_scoring_semantic`

Checkpoint:

```python
import great_expectations as gx
print(gx.__version__)
```

Checkpoint AI Functions:

En una celda temporal del notebook 02, ejecuta una prueba minima contra 3 filas de CRM. Si falla, no grabes todavia la parte AI Functions.

```python
test_ai = spark.table("bronze_crm").select("tier_fidelizacion").limit(3)
display(
    test_ai.ai.classify(
        input_col="tier_fidelizacion",
        labels=["Bronce", "Plata", "Oro", "Platino"],
        output_col="tier_norm"
    )
)
```

Despues borra o deja comentada esta celda temporal.

## 5. Importar notebooks

Crear cuatro notebooks en Fabric y pegar/importar el contenido:

```text
notebooks/00_setup_fabric.py
notebooks/01_bronze_ingesta_gx.py
notebooks/02_silver_gold_ai_quality.py
notebooks/03_features_scoring_semantic.py
```

Para cada notebook:

1. Adjuntar `lh_frasohome`.
2. Adjuntar `env_frasohome_demo`.
3. Confirmar que la primera celda incluye:

```python
repo_src = "/lakehouse/default/Files/src"
```

Si tu Lakehouse no es el default del notebook, ajusta la ruta.

Checkpoint:

```text
Los cuatro notebooks aparecen en el workspace y tienen Lakehouse + Environment adjuntos.
```

## 6. Ejecucion previa recomendada

### Notebook 00

Ejecutar completo.

Debe validar:

- 11 CSV presentes.
- `great_expectations` instalado.
- paquete `frasohome_fabric` importable.

Resultado esperado:

```text
Source modules available. Raw tables: [...]
```

### Notebook 01

Ejecutar completo una vez durante el ensayo.

Debe:

- Crear tablas `bronze_*`.
- Mostrar variantes de `tier_fidelizacion`.
- Fallar GX en `crm_bronze_contract`.
- Fallar o alertar por duplicado `S003` en tiendas.

Antes de grabar:

- Puedes limpiar salidas visuales si quieres que parezca fresco.
- No borres las tablas bronze; dejalas creadas.
- En directo, reejecuta solo las celdas de muestra y validacion GX.

### Notebook 02

Ejecutar completo antes de grabar.

Debe crear:

```text
silver_crm
silver_devoluciones_online
silver_devoluciones_tienda
silver_productos
silver_tiendas
silver_pedidos
silver_lineas_pedido
silver_ventas_pos
silver_stock_diario
gold_fact_transacciones
```

Debe pasar:

- clasificacion AI de tiers;
- clasificacion AI de motivos de devolucion;
- escritura de gold fact;
- GX sobre `gold_fact_contract`.

Antes de grabar:

- Deja las tablas ya creadas.
- En directo, reejecuta solo:
  - normalizacion de una o dos tablas;
  - celda AI Functions;
  - build de gold fact si tarda poco;
  - consulta de metricas.

### Notebook 03

Ejecutar completo antes de grabar.

Debe crear:

```text
gold_cliente_features
gold_producto_features
gold_cliente_score
```

Valida el numero de clientes en riesgo. Si necesitas clavar la cifra narrativa de la slide, ajusta el umbral o pesos en:

```text
src/frasohome_fabric/gold.py
build_customer_score()
```

Despues vuelve a subir `gold.py` a `Files/src/frasohome_fabric/` y reejecuta el notebook 03.

## 7. Validacion SQL

Abrir el SQL analytics endpoint del Lakehouse y ejecutar:

```text
sql/validation_queries.sql
```

Guarda los resultados esperados para tenerlos como chuleta:

```text
Ventas: alrededor de 1,79 M EUR
Devoluciones: alrededor de 137 k EUR
Tasa devolucion: alrededor de 7,6 %
Margen bruto: alrededor de 648 k EUR
Canales: POS mayor que ONLINE
```

Si los numeros difieren mucho:

1. Comprueba que no has duplicado tablas por reingesta.
2. Comprueba que `gold_fact_transacciones` se sobrescribe en modo overwrite.
3. Comprueba que no estas consultando la `fact_transacciones.csv` de referencia en lugar de la tabla gold generada.

## 8. Modelo semantico

Crear un modelo semantico sobre las tablas:

```text
gold_fact_transacciones
gold_cliente_score
gold_producto_features
silver_crm
silver_productos
silver_tiendas
```

Relaciones recomendadas:

```text
gold_fact_transacciones[customer_id] -> silver_crm[customer_id]
gold_fact_transacciones[product_id]  -> silver_productos[product_id]
gold_fact_transacciones[store_id]    -> silver_tiendas[store_id]
gold_cliente_score[customer_id]      -> silver_crm[customer_id]
gold_producto_features[product_id]   -> silver_productos[product_id]
```

Crear las medidas de:

```text
semantic_model/semantic_measures.dax
```

Formato recomendado:

- moneda EUR sin decimales para ventas y margen;
- porcentaje con 1 decimal para tasa de devolucion;
- entero para clientes en riesgo.

Checkpoint:

```text
Un visual simple por canal muestra Ventas netas, Margen bruto y Tasa devolucion.
```

## 9. Informe minimo Power BI opcional

No es obligatorio, pero ayuda como pantalla de respaldo.

Pagina unica:

- Cards: Ventas netas, Margen bruto, Tasa devolucion, Clientes en riesgo.
- Barras: ventas y margen por canal.
- Barras: tasa devolucion por categoria.
- Tabla: clientes en riesgo.

Usalo si Data Agent o Rayfin tardan durante la grabacion.

## 10. Data Agent

Crear Data Agent en el workspace.

Origen recomendado:

```text
Modelo semantico FraSoHome
```

Alternativa si el agente no soporta bien el modelo en tu tenant:

```text
Tablas gold del Lakehouse
```

Pegar instrucciones desde:

```text
data_agent/instructions.md
```

Probar estos prompts:

```text
Que categorias devuelven mas y como afecta al margen?
Comparame ventas netas y margen por canal.
Que clientes en riesgo conviene reactivar y con que oferta?
```

Validar cada respuesta contra:

```text
sql/validation_queries.sql
data_agent/expected_answers.md
```

Checkpoint:

```text
El agente responde con metricas coherentes y no menciona tablas bronze.
```

Plan B:

- Si el agente tarda o se equivoca, muestra la consulta SQL al lado.
- Di explicitamente que el punto importante es que el agente pregunta sobre gold/modelo semantico, no sobre CSV crudo.

## 11. Rayfin / Fabric App

Rayfin depende de disponibilidad preview. No lo dejes para el dia de grabacion.

Preparacion:

1. Confirma que Fabric Apps / Rayfin aparece en el workspace o que el CLI autorizado funciona con tu tenant.
2. Crea o abre el proyecto base de Rayfin fuera de la grabacion.
3. Copia el codigo fuente de:

```text
rayfin/
```

4. Conecta lecturas a:

```text
gold_fact_transacciones
gold_cliente_score
gold_producto_features
```

5. Conecta write-back a:

```text
ReactivacionCliente
```

6. Despliega una vez antes de grabar y guarda:

```text
URL de la app
URL del item Fabric App
captura de pantalla de respaldo
```

Durante la grabacion:

- No hagas el primer despliegue en frio.
- Si quieres mostrar CLI, muestra un cambio pequeno y despliegue incremental.
- Ten la URL ya abierta en una pestaña autenticada con Entra ID.

Plan B:

- Si Rayfin no esta disponible en tu tenant el 28 de junio de 2026, presenta la carpeta `rayfin/` como codigo de la app y usa el informe Power BI o una pantalla del modelo semantico como superficie visual.

## 12. Preparacion final del dia de grabacion

Una hora antes:

- Abre el workspace.
- Abre los cuatro notebooks.
- Ejecuta notebook 00.
- Ejecuta una celda pequena de Spark para calentar cluster.
- Abre SQL analytics endpoint con `validation_queries.sql`.
- Abre el modelo semantico.
- Abre Data Agent.
- Abre Rayfin/Fabric App si aplica.
- Comprueba fuente 16-18 pt en navegador/editor.
- Cierra pestañas que no formen parte de la demo.

Treinta minutos antes:

- Reejecuta notebook 02 si quieres refrescar silver/gold.
- Reejecuta notebook 03 si cambiaste scoring.
- Vuelve a probar los 3 prompts del Data Agent.
- Copia en una nota local los 4 numeros clave: ventas, devoluciones, tasa, margen.

Cinco minutos antes:

- Deja el workspace en la vista de artefactos.
- Deja el notebook 01 listo en la celda que lista `Files/bronze`.
- Confirma micro, resolucion y zoom.
- No reinicies Spark.

## 13. Secuencia recomendada en camara

1. Workspace: enseña Lakehouse, notebooks, modelo, Data Agent y app.
2. Notebook 01: bronze y GX fallando.
3. Notebook 02: normalizacion, AI Functions y gold fact.
4. SQL endpoint: metricas oficiales.
5. Notebook 03: scoring y clientes en riesgo.
6. Modelo semantico: medidas oficiales.
7. Rayfin/Fabric App: exploracion y accion.
8. Data Agent: preguntas y recomendaciones.
9. SQL al lado: validacion de confianza.

## 14. Tabla de riesgos

| Riesgo | Sintoma | Mitigacion |
|---|---|---|
| Spark tarda en arrancar | Notebook bloqueado en primera accion | Calentar cluster antes de grabar |
| Environment no publicado | `great_expectations` no importa | Publicar Environment y re-adjuntar notebooks |
| AI Functions no disponibles | `df.ai` no existe o falla tenant policy | Activar switches; si no, explicar limitacion y saltar a gold ya preparado |
| Numeros no cuadran | Ventas/devoluciones muy lejos de chuleta | Reejecutar notebooks 02 y 03 en overwrite |
| Data Agent responde raro | Usa campos incorrectos o inventa | Reforzar instrucciones y validar con SQL |
| Rayfin no disponible | No aparece Fabric Apps o CLI falla | Usar codigo fuente + Power BI como respaldo visual |

## 15. Criterio de listo para grabar

No empieces la grabacion hasta poder marcar esto:

- [ ] `00_setup_fabric` pasa completo.
- [ ] `01_bronze_ingesta_gx` muestra fallo controlado de GX.
- [ ] `02_silver_gold_ai_quality` crea `gold_fact_transacciones`.
- [ ] `03_features_scoring_semantic` crea tablas de scoring.
- [ ] SQL endpoint devuelve metricas coherentes.
- [ ] Modelo semantico tiene medidas DAX.
- [ ] Data Agent responde los 3 prompts.
- [ ] Rayfin/App o plan B visual esta preparado.
- [ ] Tienes capturas o pestañas abiertas por si algo tarda.

