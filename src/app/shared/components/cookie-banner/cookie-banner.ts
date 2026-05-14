import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../../core/services/cookie-consent';

@Component({
  selector: 'app-cookie-banner',
  imports: [FormsModule, RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css'
})
export class CookieBanner {
  private readonly cookieService = inject(CookieConsentService);

  readonly visible = this.cookieService.bannerVisible;

  modoDetallado = signal(false);
  analytics = signal(false);
  marketing = signal(false);

  aceptarTodo(): void {
    this.cookieService.aceptarTodo();
  }

  rechazar(): void {
    this.cookieService.rechazarOpcionales();
  }

  mostrarDetalle(): void {
    this.modoDetallado.set(true);
  }

  guardarSeleccion(): void {
    this.cookieService.guardarPersonalizado(this.analytics(), this.marketing());
  }
}
