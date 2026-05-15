// ============================================================
// GUARD: tiendaGuard
// Protege todas las rutas del área de tienda (/tienda/**).
// Permite el acceso solo si el usuario está autenticado
// y tiene el rol TIENDA. En caso contrario redirige al login.
// Se usa en app.routes.ts con canActivate: [tiendaGuard].
// ============================================================
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const tiendaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const platformId  = inject(PLATFORM_ID);

  // En SSR no hay sesión disponible — se permite pasar para evitar bloqueos
  if (!isPlatformBrowser(platformId)) return true;

  const user = authService.currentUser();

  // Acceso permitido solo si el usuario tiene rol TIENDA
  if (user && user.rol === 'TIENDA') return true;

  // Sin sesión o rol incorrecto → redirige al login
  router.navigateByUrl('/login');
  return false;
};
