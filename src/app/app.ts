// ============================================================
// COMPONENTE RAÍZ: App
// Componente bootstrap de la SPA. Monta el router outlet global
// y el banner de cookies que persiste en todas las rutas.
// ============================================================

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieBanner } from './shared/components/cookie-banner/cookie-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
