// ============================================================
// INTERCEPTOR: authInterceptor
// Adjunta el token JWT almacenado en localStorage como cabecera
// Authorization a todas las peticiones HTTP salientes. Compatible
// con SSR: lee localStorage solo en contexto de navegador.
// ============================================================

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
