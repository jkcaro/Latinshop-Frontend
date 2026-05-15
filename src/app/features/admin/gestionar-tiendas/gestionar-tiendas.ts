// ============================================================
// COMPONENTE: GestionarTiendas (Admin)
// Panel de administración de tiendas del marketplace.
// Permite al administrador revisar, aprobar, rechazar y bloquear
// tiendas. Las tiendas se agrupan por estado y se paginan
// de 4 en 4 dentro de cada sección.
// ============================================================
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
  private readonly platformId    = inject(PLATFORM_ID);
  private readonly tiendasService = inject(TiendasService);
  private readonly router         = inject(Router);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Carga todas las tiendas incluyendo pendientes y bloqueadas (endpoint admin)
    this.tiendasService.cargarTodasParaAdmin();
  }

  // ======================
  // ESTADO DE MODALES
  // ======================

  // Modal de bloqueo: pide motivo antes de bloquear
  modalBloquearAbierto         = signal(false);
  tiendaSeleccionada           = signal<number | null>(null);
  motivo                       = signal('');

  // Modal de rechazo: pide motivo antes de rechazar
  modalRechazarAbierto         = signal(false);
  tiendaRechazoSeleccionada    = signal<number | null>(null);
  motivoRechazo                = signal('');

  // Modal de detalle: muestra info completa de una tienda
  modalDetalleAbierto          = signal(false);
  tiendaDetalle                = signal<Tienda | null>(null);

  // ======================
  // PAGINACIÓN
  // ======================

  private readonly POR_PAGINA = 4;

  readonly paginaPendientes = signal(1);
  readonly paginaAprobadas  = signal(1);
  readonly paginaBloqueadas = signal(1);
  readonly paginaRechazadas = signal(1);

  // Tiendas agrupadas por estado (reactivas al signal del servicio)
  readonly tiendasPendientes = computed(() => this.tiendasService.obtenerTodasLasTiendas().filter(t => t.estado === 'PENDIENTE'));
  readonly tiendasAprobadas  = computed(() => this.tiendasService.obtenerTodasLasTiendas().filter(t => t.estado === 'APROBADA'));
  readonly tiendasBloqueadas = computed(() => this.tiendasService.obtenerTodasLasTiendas().filter(t => t.estado === 'BLOQUEADA'));
  readonly tiendasRechazadas = computed(() => this.tiendasService.obtenerTodasLasTiendas().filter(t => t.estado === 'RECHAZADA'));

  // Slice de cada grupo según la página activa
  readonly pendientesPaginadas = computed(() => this.paginar(this.tiendasPendientes(), this.paginaPendientes()));
  readonly aprobadasPaginadas  = computed(() => this.paginar(this.tiendasAprobadas(),  this.paginaAprobadas()));
  readonly bloqueadasPaginadas = computed(() => this.paginar(this.tiendasBloqueadas(), this.paginaBloqueadas()));
  readonly rechazadasPaginadas = computed(() => this.paginar(this.tiendasRechazadas(), this.paginaRechazadas()));

  readonly totalPaginasPendientes = computed(() => this.totalPags(this.tiendasPendientes()));
  readonly totalPaginasAprobadas  = computed(() => this.totalPags(this.tiendasAprobadas()));
  readonly totalPaginasBloqueadas = computed(() => this.totalPags(this.tiendasBloqueadas()));
  readonly totalPaginasRechazadas = computed(() => this.totalPags(this.tiendasRechazadas()));

  // Devuelve la página solicitada de una lista
  private paginar(lista: Tienda[], pagina: number): Tienda[] {
    const inicio = (pagina - 1) * this.POR_PAGINA;
    return lista.slice(inicio, inicio + this.POR_PAGINA);
  }

  // Calcula el total de páginas para una lista
  private totalPags(lista: Tienda[]): number {
    return Math.max(1, Math.ceil(lista.length / this.POR_PAGINA));
  }

  // Navega a una página concreta si está dentro del rango válido
  irPagina(paginaSignal: WritableSignal<number>, pagina: number, total: number): void {
    if (pagina >= 1 && pagina <= total) paginaSignal.set(pagina);
  }

  // ======================
  // ACCIONES ADMIN
  // ======================

  // Aprueba la tienda directamente (sin modal de confirmación)
  aprobar(id: number): void {
    this.tiendasService.aprobarTienda(id);
  }

  // Abre el modal con la información completa de la tienda
  abrirDetalle(tienda: Tienda): void {
    this.tiendaDetalle.set(tienda);
    this.modalDetalleAbierto.set(true);
  }

  cerrarDetalle(): void {
    this.modalDetalleAbierto.set(false);
    this.tiendaDetalle.set(null);
  }

  // Navega a la ficha completa de la tienda en el panel admin
  irADetalleCompleto(): void {
    const tienda = this.tiendaDetalle();
    if (!tienda) return;
    this.cerrarDetalle();
    this.router.navigate(['/admin/tiendas', tienda.id]);
  }

  // Abre el modal de rechazo — requiere motivo obligatorio
  abrirRechazo(id: number): void {
    this.tiendaRechazoSeleccionada.set(id);
    this.motivoRechazo.set('');
    this.modalRechazarAbierto.set(true);
  }

  // Confirma el rechazo solo si hay un motivo escrito
  confirmarRechazo(): void {
    const id     = this.tiendaRechazoSeleccionada();
    const motivo = this.motivoRechazo().trim();
    if (!id || !motivo) return;

    this.tiendasService.rechazarTienda(id, motivo);
    this.cerrarRechazo();
  }

  cerrarRechazo(): void {
    this.modalRechazarAbierto.set(false);
    this.tiendaRechazoSeleccionada.set(null);
    this.motivoRechazo.set('');
  }

  // Abre el modal de bloqueo — requiere motivo obligatorio
  abrirBloqueo(id: number): void {
    this.tiendaSeleccionada.set(id);
    this.motivo.set('');
    this.modalBloquearAbierto.set(true);
  }

  // Confirma el bloqueo solo si hay un motivo escrito
  confirmarBloqueo(): void {
    const id     = this.tiendaSeleccionada();
    const motivo = this.motivo();
    if (!id || !motivo.trim()) return;

    this.tiendasService.bloquearTienda(id, motivo);
    this.cerrarBloqueo();
  }

  cerrarBloqueo(): void {
    this.modalBloquearAbierto.set(false);
    this.tiendaSeleccionada.set(null);
    this.motivo.set('');
  }

  // Desbloquea una tienda y la vuelve a poner en estado APROBADA
  desbloquear(id: number): void {
    this.tiendasService.desbloquearTienda(id);
  }

  // Mueve una tienda rechazada a PENDIENTE para que el admin la revise de nuevo
  pasarAPendiente(id: number): void {
    this.tiendasService.marcarTiendaPendiente(id);
  }
}
