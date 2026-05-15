// ============================================================
// COMPONENTE: AvisoLegal
// Página de contenido estático con el aviso legal del marketplace.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-aviso-legal',
  imports: [RouterLink],
  templateUrl: './aviso-legal.html',
  styleUrl: '../legal-page.css'
})
export class AvisoLegal {
  private readonly auth = inject(AuthService);

  readonly urlInicio = computed(() => {
    const rol = this.auth.role();
    if (rol === 'CLIENTE') return '/cliente/panel';
    if (rol === 'TIENDA') return '/tienda/panel';
    if (rol === 'ADMIN') return '/admin';
    return '/';
  });
}
