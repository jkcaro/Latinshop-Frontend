// ============================================================
// COMPONENTE: PoliticaPrivacidad
// Página de contenido estático con la política de privacidad.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-politica-privacidad',
  imports: [RouterLink],
  templateUrl: './politica-privacidad.html',
  styleUrl: '../legal-page.css'
})
export class PoliticaPrivacidad {
  private readonly auth = inject(AuthService);

  readonly urlInicio = computed(() => {
    const rol = this.auth.role();
    if (rol === 'CLIENTE') return '/cliente/panel';
    if (rol === 'TIENDA') return '/tienda/panel';
    if (rol === 'ADMIN') return '/admin';
    return '/';
  });
}
