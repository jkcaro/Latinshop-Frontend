import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { TiendasService } from '../../../core/services/tiendas';
import { ThemeService, Theme } from '../../../core/services/theme';

@Component({
  selector: 'app-mi-perfil',
  imports: [FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfil {
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  readonly themeService = inject(ThemeService);

  setTheme(t: Theme): void { this.themeService.setClienteTheme(t); }

  readonly currentUser = this.authService.currentUser;

  nombre = signal('');
  apellidos = signal('');
  email = signal('');
  telefono = signal('');
  password = signal('');
  fotoPerfil = signal('');
  direccion = signal('');
  ciudadId = signal<number | null>(null);
  ciudades = signal<{ id: number; nombre: string }[]>([]);

  mostrarPassword = signal(false);
  error   = signal('');
  success = signal('');

  private cargado = false;

  constructor() {
    this.tiendasService.getCiudades().subscribe(c => this.ciudades.set(c));

    effect(() => {
      const user = this.currentUser();

      if (!user || this.cargado) return;
      this.cargado = true;

      this.nombre.set(user.nombre ?? '');
      this.apellidos.set(user.apellidos ?? '');
      this.email.set(user.email ?? '');
      this.telefono.set(user.telefono ?? '');
      this.password.set(user.password ?? '');
      this.fotoPerfil.set(user.fotoPerfil ?? '');
      this.direccion.set(user.direccion ?? '');
      this.ciudadId.set(user.ciudadId ?? null);
    });
  }

  cambiarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('Solo se permiten imágenes.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.fotoPerfil.set(canvas.toDataURL('image/jpeg', 0.75));
        this.error.set('');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private successTimer: ReturnType<typeof setTimeout> | null = null;

  guardarCambios(): void {
    this.error.set('');
    this.success.set('');

    this.authService.actualizarPerfilCliente({
      nombre: this.nombre(),
      apellidos: this.apellidos(),
      email: this.email(),
      telefono: this.telefono(),
      password: this.password(),
      fotoPerfil: this.fotoPerfil(),
      direccion: this.direccion(),
      ciudadId: this.ciudadId()
    }).subscribe(result => {
      if (!result.ok) {
        this.error.set(result.message);
      } else {
        this.success.set(result.message);
        if (this.successTimer) clearTimeout(this.successTimer);
        this.successTimer = setTimeout(() => this.success.set(''), 3500);
      }
    });
  }
}
