import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ShieldCheck, Truck, Package, Headphones } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  tipoAcceso = signal<'CLIENTE' | 'TIENDA' | 'ADMIN'>('CLIENTE');
  email = signal('');
  password = signal('');
  error = signal('');
  success = signal('');
  loading = signal(false);
  mostrarPassword = signal(false);
  recordarme = signal(false);

  readonly ShieldCheck  = ShieldCheck;
  readonly Truck        = Truck;
  readonly Package      = Package;
  readonly Headphones   = Headphones;

  login(): void {
    this.error.set('');
    this.success.set('');

    const email = this.email().trim();
    const password = this.password().trim();

    if (!email || !password) {
      this.error.set('Completa el correo y la contraseña.');
      return;
    }

    this.loading.set(true);

    this.authService.login(email, password).subscribe(result => {
      this.loading.set(false);

      if (!result.ok) {
        this.error.set(result.message);
        return;
      }

      const rolReal = this.authService.role();
      const tipoElegido = this.tipoAcceso();

      if (rolReal !== tipoElegido) {
        this.authService.logout();
        const nombres: Record<string, string> = {
          CLIENTE: 'Cliente',
          TIENDA:  'Tienda',
          ADMIN:   'Administrador',
        };
        this.error.set(
          `Esta cuenta es de tipo "${nombres[rolReal] ?? rolReal}". ` +
          `Selecciona "${nombres[rolReal] ?? rolReal}" en el tipo de acceso e intenta de nuevo.`
        );
        return;
      }

      this.success.set('Acceso correcto.');

      if (rolReal === 'CLIENTE') {
        this.router.navigate(['/cliente']);
      } else if (rolReal === 'TIENDA') {
        this.router.navigateByUrl('/tienda/panel');
      } else if (rolReal === 'ADMIN') {
        this.router.navigateByUrl('/admin');
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }
}
