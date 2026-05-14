import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-recuperar-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPassword {
  private readonly authService = inject(AuthService);

  email = signal('');
  error = signal('');
  success = signal('');
  loading = signal(false);

  solicitar(): void {
    this.error.set('');
    this.success.set('');

    const correo = this.email().trim();
    if (!correo) {
      this.error.set('Introduce tu correo electrónico.');
      return;
    }

    this.loading.set(true);

    this.authService.solicitarReset(correo).subscribe(result => {
      this.loading.set(false);
      if (!result.ok) {
        this.error.set(result.message);
        return;
      }
      this.success.set(result.message);
    });
  }
}
