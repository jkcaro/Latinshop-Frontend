export type UserRole = 'PUBLICO' | 'CLIENTE' | 'TIENDA' | 'ADMIN';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'BLOQUEADA';

  apellidos?: string;
  telefono?: string;
  password?: string;
  fotoPerfil?: string;
  direccion?: string;
  clienteId?: number;
  tiendaId?: number;
  ciudadId?: number | null;
}
