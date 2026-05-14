export type EstadoTienda = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'BLOQUEADA';

export interface HorarioTienda {
  dia_semana: number; // 0=Lunes … 6=Domingo
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
}

export interface Tienda {
  id: number;
  nombrePropietario: string;
  apellidosPropietario: string;
  email: string;
  password: string;
  nombreNegocio: string;
  nifCif: string;
  ciudad: string;
  ciudadId?: number;
  direccion: string;
  telefono: string;
  descripcion: string;
  aceptaPolitica: boolean;
  recibeOfertas: boolean;
  estado: EstadoTienda;
  activa: boolean;

  imagenUrl?: string;
  motivoAdmin?: string;
  notaInterna?: string;
  radioEntrega?: number;
}
