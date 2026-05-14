export interface Mensaje {
  id: number;
  pedidoId: number;
  remitenteTipo: 'CLIENTE' | 'TIENDA';
  remitenteId: number;
  contenido: string;
  fechaEnvio: string;
  leido: boolean;
}
