// ============================================================
// COMPONENTE: MiPerfilTienda
// Gestión del perfil del negocio: edición de datos del propietario
// y de la tienda, cambio de contraseña, subida de imagen de portada
// y selección de tema visual del panel.
// ============================================================

import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { TiendasService } from '../../../core/services/tiendas';
import { ThemeService, Theme } from '../../../core/services/theme';
import { HorarioTienda } from '../../../core/models/tienda.model';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function horariosVacios(): HorarioTienda[] {
  return DIAS.map((_, i) => ({
    dia_semana: i,
    hora_apertura: '09:00',
    hora_cierre: '20:00',
    cerrado: i >= 6
  }));
}

@Component({
  selector: 'app-mi-perfil-tienda',
  imports: [FormsModule, AdminModal],
  templateUrl: './mi-perfil-tienda.html',
  styleUrl: './mi-perfil-tienda.css'
})
export class MiPerfilTienda {
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  readonly themeService = inject(ThemeService);

  setTheme(t: Theme): void { this.themeService.setTiendaTheme(t); }

  readonly diasNombres = DIAS;

  readonly currentUser = this.authService.currentUser;

  readonly tienda = computed(() => {
    const user = this.currentUser();
    if (!user || user.rol !== 'TIENDA') return null;
    return this.tiendasService.obtenerPorId(user.tiendaId!) ?? null;
  });

  nombreNegocio = signal('');
  nombrePropietario = signal('');
  apellidosPropietario = signal('');
  email = signal('');
  telefono = signal('');
  ciudadId = signal<number>(0);
  ciudades = signal<{ id: number; nombre: string }[]>([]);
  direccion = signal('');
  descripcion = signal('');
  imagenUrl = signal('');
  previewImagen = signal('');
  imagenPendiente = signal(false);
  radioEntrega = signal(0);

  envioGratisActivo = signal(false);
  umbralEnvioGratis = signal(15);

  horarios = signal<HorarioTienda[]>(horariosVacios());
  errorHorarios = signal('');
  successHorarios = signal('');
  mostrarModalHorarios = signal(false);

  error = signal('');
  success = signal('');

  private cargado = false;

  constructor() {
    this.tiendasService.getCiudades().subscribe(c => this.ciudades.set(c));

    effect(() => {
      const tienda = this.tienda();
      if (!tienda || this.cargado) return;

      this.cargado = true;
      this.nombreNegocio.set(tienda.nombreNegocio);
      this.nombrePropietario.set(tienda.nombrePropietario);
      this.apellidosPropietario.set(tienda.apellidosPropietario);
      this.email.set(tienda.email);
      this.telefono.set(tienda.telefono);
      this.ciudadId.set(tienda.ciudadId ?? 0);
      this.direccion.set(tienda.direccion);
      this.descripcion.set(tienda.descripcion);
      this.imagenUrl.set(tienda.imagenUrl ?? '');
      this.previewImagen.set(tienda.imagenUrl ?? '');
      this.radioEntrega.set(tienda.radioEntrega ?? 0);

      try {
        const cfg = localStorage.getItem(`tienda_envio_gratis_${tienda.id}`);
        if (cfg) {
          const parsed = JSON.parse(cfg) as { activo: boolean; umbral: number };
          this.envioGratisActivo.set(parsed.activo ?? false);
          this.umbralEnvioGratis.set(parsed.umbral ?? 15);
        }
      } catch { /* localStorage no disponible */ }

      this.tiendasService.getHorarios(tienda.id).subscribe(rows => {
        if (rows.length === 0) return;
        const base = horariosVacios();
        rows.forEach(r => {
          const idx = base.findIndex(h => h.dia_semana === r.dia_semana);
          if (idx >= 0) base[idx] = { ...r, cerrado: !!r.cerrado };
        });
        this.horarios.set(base);
      });
    });
  }

  setHorarioCerrado(idx: number, cerrado: boolean): void {
    const copia = [...this.horarios()];
    copia[idx] = { ...copia[idx], cerrado };
    this.horarios.set(copia);
  }

  setHoraApertura(idx: number, value: string): void {
    const copia = [...this.horarios()];
    copia[idx] = { ...copia[idx], hora_apertura: value };
    this.horarios.set(copia);
  }

  setHoraCierre(idx: number, value: string): void {
    const copia = [...this.horarios()];
    copia[idx] = { ...copia[idx], hora_cierre: value };
    this.horarios.set(copia);
  }

  guardarHorarios(): void {
    this.errorHorarios.set('');
    this.successHorarios.set('');
    const actual = this.tienda();
    if (!actual) return;

    this.tiendasService.guardarHorarios(actual.id, this.horarios()).subscribe(result => {
      if (result.ok) {
        this.successHorarios.set(result.message);
        setTimeout(() => { this.mostrarModalHorarios.set(false); this.successHorarios.set(''); }, 1000);
      } else {
        this.errorHorarios.set(result.message);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('Solo se permiten imágenes.'); return; }
    if (file.size > 2000000) { this.error.set('La imagen es demasiado pesada (máx 2MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagenUrl.set(result);
      this.previewImagen.set(result);
      this.imagenPendiente.set(true);
      this.error.set('');
      this.success.set('');
    };
    reader.readAsDataURL(file);
  }

  guardarCambios(): void {
    this.error.set('');
    this.success.set('');
    const actual = this.tienda();
    if (!actual) { this.error.set('No se encontró la tienda.'); return; }

    this.tiendasService.actualizarPerfilTienda(actual.id, {
      nombreNegocio: this.nombreNegocio(),
      nombrePropietario: this.nombrePropietario(),
      apellidosPropietario: this.apellidosPropietario(),
      email: this.email(),
      telefono: this.telefono(),
      ciudad: this.ciudades().find(c => c.id === this.ciudadId())?.nombre ?? '',
      ciudadId: this.ciudadId(),
      direccion: this.direccion(),
      descripcion: this.descripcion(),
      imagenUrl: this.imagenUrl(),
      radioEntrega: this.radioEntrega()
    }).subscribe(result => {
      if (!result.ok) {
        this.error.set(result.message);
      } else {
        this.imagenPendiente.set(false);
        this.success.set(result.message);
        try {
          localStorage.setItem(`tienda_envio_gratis_${actual.id}`, JSON.stringify({
            activo: this.envioGratisActivo(),
            umbral: this.umbralEnvioGratis()
          }));
        } catch { /* localStorage no disponible */ }
      }
    });
  }
}
