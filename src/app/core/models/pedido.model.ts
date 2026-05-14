export type EstadoPedido =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type MetodoPago =
  | 'TARJETA'
  | 'PAYPAL'
  | 'TRANSFERENCIA'
  | 'CONTRA_ENTREGA';

export type MetodoEnvio =
  | 'ESTANDAR'
  | 'EXPRESS'
  | 'RECOGIDA_TIENDA';

export type EstadoPago =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'RECHAZADO'
  | 'REEMBOLSADO';

export interface PedidoItem {
  productoId: number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
  imagenUrl?: string;
}

export interface PedidoHistorialEntry {
  estado: string;
  comentario: string;
  fecha: string;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  clienteEmail: string;
  tiendaId: number;
  tiendaNombre: string;
  estado: EstadoPedido;
  metodoPago: MetodoPago;
  metodoEnvio: MetodoEnvio;
  estadoPago: EstadoPago;
  subtotal: number;
  costoEnvio: number;
  iva: number;
  total: number;
  direccionEnvio: string;
  ciudadEnvio: string;
  codigoPostalEnvio: string;
  fechaPedido: string;
  items: PedidoItem[];
  historial: PedidoHistorialEntry[];
}
