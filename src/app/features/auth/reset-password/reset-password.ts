// ============================================================
// COMPONENTE: ResetPassword
// Lee el token JWT de los queryParams, valida la nueva contraseña
// y llama al backend para aplicar el cambio. Redirige a /login
// tras el éxito.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: '../recuperar-password/recuperar-password.css'
})
export class ResetPassword implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = signal('');
  password = signal('');
  confirmar = signal('');
  error = signal('');
  success = signal('');
  loading = signal(false);
  tokenInvalido = signal(false);

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!t) {
      this.tokenInvalido.set(true);
      return;
    }
    this.token.set(t);
  }

  guardar(): void {
    this.error.set('');

    if (!this.password() || !this.confirmar()) {
      this.error.set('Completa ambos campos.');
      return;
    }
    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.password() !== this.confirmar()) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    this.authService.resetPassword(this.token(), this.password()).subscribe(result => {
      this.loading.set(false);
      if (!result.ok) {
        this.error.set(result.message);
        return;
      }
      this.success.set(result.message);
      setTimeout(() => this.router.navigateByUrl('/login'), 2000);
    });
  }
}
