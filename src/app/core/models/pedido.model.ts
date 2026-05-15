// ============================================================
// MODELO: Pedido y tipos relacionados
// Define la estructura de datos de los pedidos del marketplace.
// Un pedido pertenece a un cliente, está asociado a una tienda
// y contiene ítems, historial de estados y datos de envío.
// ============================================================

// Estado actual del pedido en su ciclo de vida
export type EstadoPedido =
  | 'PENDIENTE'       // Pedido recibido, aún no procesado por la tienda
  | 'EN_PREPARACION'  // La tienda está preparando el pedido
  | 'ENVIADO'         // El pedido salió hacia el cliente
  | 'ENTREGADO'       // Pedido recibido por el cliente — finalizado
  | 'CANCELADO';      // Pedido cancelado por cualquier parte

// Métodos de pago disponibles en el checkout
export type MetodoPago =
  | 'TARJETA'
  | 'PAYPAL'
  | 'BIZUM'
  | 'TRANSFERENCIA'
  | 'CONTRA_ENTREGA';

// Métodos de envío disponibles con sus costes asociados
export type MetodoEnvio =
  | 'ESTANDAR'         // ~1 h, 2,50 € (gratis si aplica umbral de tienda)
  | 'EXPRESS'          // ~30 min, 5,50 €
  | 'RECOGIDA_TIENDA'; // Gratuita, el cliente recoge en tienda

// Estado del pago asociado al pedido
export type EstadoPago =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'RECHAZADO'
  | 'REEMBOLSADO';

// Cada producto dentro de un pedido
export interface PedidoItem {
  productoId:     number;
  nombreProducto: string;
  precioUnitario: number;
  cantidad:       number;
  subtotal:       number;
  imagenUrl?:     string;
}

// Registro de cada cambio de estado del pedido (trazabilidad)
export interface PedidoHistorialEntry {
  estado:     string;
  comentario: string;
  fecha:      string;
}

// Pedido completo con todos sus datos relacionados
export interface Pedido {
  id:                number;
  numeroPedido:      string;   // Identificador legible (ej: PED-0001)
  clienteEmail:      string;
  tiendaId:          number;
  tiendaNombre:      string;
  estado:            EstadoPedido;
  metodoPago:        MetodoPago;
  metodoEnvio:       MetodoEnvio;
  estadoPago:        EstadoPago;
  subtotal:          number;   // Suma de ítems sin envío ni IVA
  costoEnvio:        number;
  iva:               number;   // 21% aplicado al subtotal
  total:             number;   // subtotal + costoEnvio + iva
  direccionEnvio:    string;
  ciudadEnvio:       string;
  codigoPostalEnvio: string;
  fechaPedido:       string;
  items:             PedidoItem[];
  historial:         PedidoHistorialEntry[];
}
