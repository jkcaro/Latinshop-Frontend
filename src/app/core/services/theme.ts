// ============================================================
// SERVICIO: ThemeService
// Gestiona el tema visual (ocean / sunset / forest) de forma
// independiente para cada área (admin, tienda, cliente).
// Persiste la selección en localStorage por clave de área.
// ============================================================

import { Injectable, signal } from '@angular/core';

export type Theme = 'ocean' | 'sunset' | 'forest';

function loadTheme(key: string, fallback: Theme): Theme {
  if (typeof localStorage === 'undefined') return fallback;
  return (localStorage.getItem(key) as Theme) ?? fallback;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly clienteTheme = signal<Theme>(loadTheme('theme_cliente', 'ocean'));
  readonly tiendaTheme  = signal<Theme>(loadTheme('theme_tienda',  'sunset'));
  readonly adminTheme   = signal<Theme>(loadTheme('theme_admin',   'sunset'));

  setClienteTheme(theme: Theme): void {
    this.clienteTheme.set(theme);
    localStorage.setItem('theme_cliente', theme);
  }

  setTiendaTheme(theme: Theme): void {
    this.tiendaTheme.set(theme);
    localStorage.setItem('theme_tienda', theme);
  }

  setAdminTheme(theme: Theme): void {
    this.adminTheme.set(theme);
    localStorage.setItem('theme_admin', theme);
  }
}
