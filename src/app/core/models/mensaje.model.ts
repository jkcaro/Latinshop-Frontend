// ============================================================
// MODELO: Mensaje
// Representa un mensaje de la conversación entre cliente y tienda
// dentro de un pedido. remitenteTipo indica quién envió el mensaje
// (CLIENTE o TIENDA) para mostrarlo en el lado correcto del chat.
// ============================================================

export interface Mensaje {
  id: number;
  pedidoId: number;
  remitenteTipo: 'CLIENTE' | 'TIENDA';
  remitenteId: number;
  contenido: string;
  fechaEnvio: string;
  leido: boolean;
}
