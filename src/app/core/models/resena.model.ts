// ============================================================
// MODELO: Resena y EstadisticasResenas
// Resena representa la valoración de un cliente sobre una tienda
// tras un pedido. EstadisticasResenas agrega el total y el promedio
// de calificaciones para mostrarlo en la ficha pública de la tienda.
// ============================================================

export type EstadoResena = 'VISIBLE' | 'OCULTA';

export interface Resena {
  id: number;
  tiendaId: number;
  clienteId: number;
  clienteNombre: string;
  pedidoId: number;
  calificacion: 1 | 2 | 3 | 4 | 5;
  comentario: string | null;
  fecha: string;
  estado: EstadoResena;
  tiendasNombre?: string;
}

export interface EstadisticasResenas {
  total: number;
  promedio: number;
  estrellas5: number;
  estrellas4: number;
  estrellas3: number;
  estrellas2: number;
  estrellas1: number;
}
