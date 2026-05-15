// ============================================================
// MODELO: AuthUser
// Representa al usuario autenticado en la sesión activa.
// Se persiste en localStorage y se expone como signal reactivo
// a través de AuthService. El rol determina qué áreas del
// sistema puede acceder y qué guards le permiten el paso.
// ============================================================

// Roles disponibles en el sistema:
// - PUBLICO:  visitante sin sesión (acceso solo a rutas públicas)
// - CLIENTE:  comprador registrado (acceso a /cliente/**)
// - TIENDA:   propietario de negocio (acceso a /tienda/**)
// - ADMIN:    administrador del marketplace (acceso a /admin/**)
export type UserRole = 'PUBLICO' | 'CLIENTE' | 'TIENDA' | 'ADMIN';

export interface AuthUser {
  id:     number;
  nombre: string;
  email:  string;
  rol:    UserRole;

  // Estado de la cuenta (usado principalmente para tiendas)
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'BLOQUEADA';

  // Datos opcionales del perfil
  apellidos?:  string;
  telefono?:   string;
  password?:   string;
  fotoPerfil?: string;
  direccion?:  string;

  // IDs relacionales — presente según el rol del usuario
  clienteId?: number;   // Solo para rol CLIENTE
  tiendaId?:  number;   // Solo para rol TIENDA
  ciudadId?:  number | null; // Ciudad de registro (restringe compras entre ciudades)
}
