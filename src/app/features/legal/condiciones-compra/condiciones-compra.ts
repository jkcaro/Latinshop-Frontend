import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-condiciones-compra',
  imports: [RouterLink],
  templateUrl: './condiciones-compra.html',
  styleUrl: '../legal-page.css'
})
export class CondicionesCompra {
  private readonly auth = inject(AuthService);

  readonly urlInicio = computed(() => {
    const rol = this.auth.role();
    if (rol === 'CLIENTE') return '/cliente/panel';
    if (rol === 'TIENDA') return '/tienda/panel';
    if (rol === 'ADMIN') return '/admin';
    return '/';
  });
}
