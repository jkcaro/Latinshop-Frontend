import { Component, OnInit, PLATFORM_ID, WritableSignal, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Tienda } from '../../../core/models/tienda.model';
import { TiendasService } from '../../../core/services/tiendas';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

@Component({
  selector: 'app-gestionar-tiendas',
  imports: [AdminModal],
  templateUrl: './gestionar-tiendas.html',
  styleUrl: './gestionar-tiendas.css',
})
export class GestionarTiendas implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.tiendasService.cargarTodasParaAdmin();
  }

  modalBloquearAbierto = signal(false);
  tiendaSeleccionada = signal<number | null>(null);
  motivo = signal('');

  modalRechazarAbierto = signal(false);
  tiendaRechazoSeleccionada = signal<number | null>(null);
  motivoRechazo = signal('');

  modalDetalleAbierto = signal(false);
  tiendaDetalle = signal<Tienda | null>(null);

  private readonly POR_PAGINA = 4;

  readonly paginaPendientes  = signal(1);
  readonly paginaAprobadas   = signal(1);
  readonly paginaBloqueadas  = signal(1);
  readonly paginaRechazadas  = signal(1);

  readonly tiendasPendientes = computed(() =>
    this.tiendasService.obtenerTodasLasTiendas().filter((t) => t.estado === 'PENDIENTE'),
  );
  readonly tiendasAprobadas = computed(() =>
    this.tiendasService.obtenerTodasLasTiendas().filter((t) => t.estado === 'APROBADA'),
  );
  readonly tiendasBloqueadas = computed(() =>
    this.tiendasService.obtenerTodasLasTiendas().filter((t) => t.estado === 'BLOQUEADA'),
  );
  readonly tiendasRechazadas = computed(() =>
    this.tiendasService.obtenerTodasLasTiendas().filter((t) => t.estado === 'RECHAZADA'),
  );

  readonly pendientesPaginadas = computed(() => this.paginar(this.tiendasPendientes(), this.paginaPendientes()));
  readonly aprobadasPaginadas  = computed(() => this.paginar(this.tiendasAprobadas(),  this.paginaAprobadas()));
  readonly bloqueadasPaginadas = computed(() => this.paginar(this.tiendasBloqueadas(), this.paginaBloqueadas()));
  readonly rechazadasPaginadas = computed(() => this.paginar(this.tiendasRechazadas(), this.paginaRechazadas()));

  readonly totalPaginasPendientes = computed(() => this.totalPags(this.tiendasPendientes()));
  readonly totalPaginasAprobadas  = computed(() => this.totalPags(this.tiendasAprobadas()));
  readonly totalPaginasBloqueadas = computed(() => this.totalPags(this.tiendasBloqueadas()));
  readonly totalPaginasRechazadas = computed(() => this.totalPags(this.tiendasRechazadas()));

  private paginar(lista: Tienda[], pagina: number): Tienda[] {
    const inicio = (pagina - 1) * this.POR_PAGINA;
    return lista.slice(inicio, inicio + this.POR_PAGINA);
  }

  private totalPags(lista: Tienda[]): number {
    return Math.max(1, Math.ceil(lista.length / this.POR_PAGINA));
  }

  irPagina(paginaSignal: WritableSignal<number>, pagina: number, total: number): void {
    if (pagina >= 1 && pagina <= total) paginaSignal.set(pagina);
  }

  aprobar(id: number): void {
    this.tiendasService.aprobarTienda(id);
  }

  abrirDetalle(tienda: Tienda): void {
    this.tiendaDetalle.set(tienda);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.tiendaDetalle.set(null);
  }

  irADetalleCompleto(): void {
    const tienda = this.tiendaDetalle();
    if (!tienda) return;

    this.cerrarDetalle();
    this.router.navigate(['/admin/tiendas', tienda.id]);
  }

  abrirRechazo(id: number): void {
    this.tiendaRechazoSeleccionada.set(id);
    this.motivoRechazo.set('');
    this.modalRechazarAbierto.set(true);
  }

  confirmarRechazo(): void {
    const id = this.tiendaRechazoSeleccionada();
    const motivo = this.motivoRechazo().trim();

    if (!id || !motivo) {
      return;
    }

    this.tiendasService.rechazarTienda(id, motivo);
    this.modalRechazarAbierto.set(false);
    this.tiendaRechazoSeleccionada.set(null);
    this.motivoRechazo.set('');
  }

  cerrarRechazo(): void {
    this.modalRechazarAbierto.set(false);
    this.tiendaRechazoSeleccionada.set(null);
    this.motivoRechazo.set('');
  }

  abrirBloqueo(id: number): void {
    this.tiendaSeleccionada.set(id);
    this.motivo.set('');
    this.modalBloquearAbierto.set(true);
  }

  confirmarBloqueo(): void {
    const id = this.tiendaSeleccionada();
    const motivo = this.motivo();

    if (!id || !motivo.trim()) return;

    this.tiendasService.bloquearTienda(id, motivo);

    this.modalBloquearAbierto.set(false);
    this.tiendaSeleccionada.set(null);
    this.motivo.set('');
  }

  cerrarBloqueo(): void {
    this.modalBloquearAbierto.set(false);
    this.tiendaSeleccionada.set(null);
    this.motivo.set('');
  }

  desbloquear(id: number): void {
    this.tiendasService.desbloquearTienda(id);
  }

  pasarAPendiente(id: number): void {
    this.tiendasService.marcarTiendaPendiente(id);
  }
}
