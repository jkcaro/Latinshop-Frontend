// ============================================================
// GUARD: clienteGuard
// Protege todas las rutas del área de cliente (/cliente/**).
// Permite el acceso solo si el usuario está autenticado
// y tiene el rol CLIENTE. En caso contrario redirige al login.
// Se usa en app.routes.ts con canActivate: [clienteGuard].
// ============================================================
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const clienteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const platformId  = inject(PLATFORM_ID);

  // En SSR no hay sesión disponible — se permite pasar para evitar bloqueos
  if (!isPlatformBrowser(platformId)) return true;

  const user = authService.currentUser();

  // Acceso permitido solo si el usuario tiene rol CLIENTE
  if (user && user.rol === 'CLIENTE') return true;

  // Sin sesión o rol incorrecto → redirige al login
  router.navigateByUrl('/login');
  return false;
};
