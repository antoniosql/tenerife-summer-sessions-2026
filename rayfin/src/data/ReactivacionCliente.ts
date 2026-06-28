import { boolean, date, entity, integer, role, text, uuid } from "@microsoft/rayfin-core";

@entity()
@role("authenticated", "*")
export class ReactivacionCliente {
  @uuid()
  id!: string;

  @text()
  customer_id!: string;

  @integer()
  score!: number;

  @integer()
  recencia_dias!: number;

  @text()
  categoria_preferida!: string;

  @text()
  oferta_sugerida!: string;

  @boolean()
  en_campania!: boolean;

  @date()
  creado_el!: Date;
}

