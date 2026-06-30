import { authenticated, boolean, date, entity, int, text, uuid } from "@microsoft/rayfin-core";

@entity()
@authenticated("*")
export class ReactivacionCliente {
  @uuid()
  id!: string;

  @text({ max: 32 })
  customer_id!: string;

  @int()
  score!: number;

  @int()
  recencia_dias!: number;

  @text({ max: 80 })
  categoria_preferida!: string;

  @text({ max: 200 })
  oferta_sugerida!: string;

  @boolean()
  en_campania!: boolean;

  @date()
  creado_el!: Date;
}
