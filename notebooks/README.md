# Notebooks Fabric

Importa en Microsoft Fabric los ficheros `.ipynb`:

```text
00_setup_fabric.ipynb
01_bronze_ingesta_gx.ipynb
02_silver_gold_ai_quality.ipynb
03_features_scoring_semantic.ipynb
```


Antes de ejecutar:

1. Adjunta el Lakehouse que contiene `Files/bronze`.
2. Adjunta el Environment con `great_expectations`.
3. Sube `src/frasohome_fabric` a `Files/src/frasohome_fabric`.
4. Confirma que la ruta usada en los notebooks es correcta:

```python
repo_src = "/lakehouse/default/Files/src"
```

