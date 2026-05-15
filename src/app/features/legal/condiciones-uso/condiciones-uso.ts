// ============================================================
// COMPONENTE: CondicionesUso
// Página de contenido estático con las condiciones de uso.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-condiciones-uso',
  imports: [RouterLink],
  templateUrl: './condiciones-uso.html',
  styleUrl: '../legal-page.css'
})
export class CondicionesUso {
  private readonly auth = inject(AuthService);

  readonly urlInicio = computed(() => {
    const rol = this.auth.role();
    if (rol === 'CLIENTE') return '/cliente/panel';
    if (rol === 'TIENDA') return '/tienda/panel';
    if (rol === 'ADMIN') return '/admin';
    return '/';
  });
}
