// ============================================================
// COMPONENTE: RegistroCliente
// Formulario de alta para nuevas cuentas de cliente. Tras el
// registro llama a loginCliente automáticamente y redirige al
// panel del comprador.
// ============================================================

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-registro-cliente',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro-cliente.html',
  styleUrl: './registro-cliente.css'
})
export class RegistroCliente {
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);

  nombre = signal('');
  apellidos = signal('');
  email = signal('');
  password = signal('');
  telefono = signal('');
  direccion = signal('');
  ciudadId = signal<number | null>(null);
  ciudades = signal<{ id: number; nombre: string }[]>([]);
  aceptaPrivacidad = signal(false);
  error = signal('');
  success = signal('');
  loading = signal(false);

  constructor() {
    this.tiendasService.getCiudades().subscribe(c => this.ciudades.set(c));
  }

  registrar(): void {
    this.error.set('');
    this.success.set('');

    if (!this.nombre() || !this.email() || !this.password()) {
      this.error.set('Nombre, email y contraseña son obligatorios.');
      return;
    }

    if (!this.ciudadId()) {
      this.error.set('Selecciona tu ciudad de residencia.');
      return;
    }

    if (!this.aceptaPrivacidad()) {
      this.error.set('Debes leer y aceptar la política de privacidad para continuar.');
      return;
    }

    this.loading.set(true);

    this.authService.registrarCliente({
      nombre: this.nombre(),
      apellidos: this.apellidos(),
      email: this.email(),
      password: this.password(),
      telefono: this.telefono(),
      direccion: this.direccion(),
      ciudad_id: this.ciudadId(),
      acepta_privacidad: this.aceptaPrivacidad()
    }).subscribe(result => {
      this.loading.set(false);

      if (!result.ok) {
        this.error.set(result.message);
        return;
      }

      this.success.set('Registro exitoso. Iniciando sesión...');

      this.authService.loginCliente(this.email(), this.password()).subscribe(() => {
        setTimeout(() => this.router.navigateByUrl('/cliente/productos'), 800);
      });
    });
  }
}
