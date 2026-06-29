# Rayfin Data Model

This folder contains only source definitions. Do not deploy from the recording repo until the Fabric App item has been prepared in the target workspace.

The main write-back entity is `ReactivacionCliente`. It represents the business action created from the governed `gold_cliente_score` table: selecting a customer for a reactivation campaign.

Expected Fabric read sources:

- `gold_fact_transacciones`
- `gold_cliente_score`
- `gold_producto_features`

Expected write-back entity:

- `ReactivacionCliente`

