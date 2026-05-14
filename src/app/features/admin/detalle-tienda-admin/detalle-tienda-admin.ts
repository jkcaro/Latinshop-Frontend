import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { PedidosService } from '../../../core/services/pedidos';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

type SeccionDetalle = 'PRODUCTOS' | 'PEDIDOS' | 'VENTAS';

@Component({
  selector: 'app-detalle-tienda-admin',
  imports: [CurrencyPipe, DatePipe, FormsModule, AdminModal],
  templateUrl: './detalle-tienda-admin.html',
  styleUrl: './detalle-tienda-admin.css',
})
export class DetalleTiendaAdmin {
  private readonly route = inject(ActivatedRoute);
  private readonly tiendasService = inject(TiendasService);
  private readonly productosService = inject(ProductosService);
  private readonly pedidosService = inject(PedidosService);

  readonly tiendaId = Number(this.route.snapshot.paramMap.get('id'));

  readonly notaInterna = signal('');
  readonly success = signal('');
  readonly seccionActiva = signal<SeccionDetalle>('PRODUCTOS');

  readonly paginaProductos = signal(1);
  readonly paginaPedidos = signal(1);
  readonly itemsPorPagina = signal(5);

  readonly modalBloquearAbierto = signal(false);
  readonly motivoBloqueo = signal('');

  readonly modalRechazarAbierto = signal(false);
  readonly motivoRechazo = signal('');

  readonly modalPedidoAbierto = signal(false);
  readonly pedidoDetalle = signal<any | null>(null);

  readonly tienda = computed(() => {
    if (!this.tiendaId || Number.isNaN(this.tiendaId)) return null;

    return this.tiendasService.obtenerPorId(this.tiendaId) ?? null;
  });

  readonly productos = computed(() => {
    if (!this.tiendaId || Number.isNaN(this.tiendaId)) return [];

    return this.productosService.obtenerPorTienda(this.tiendaId);
  });

  readonly pedidos = computed(() => {
    if (!this.tiendaId || Number.isNaN(this.tiendaId)) return [];

    return this.pedidosService.obtenerPorTienda(this.tiendaId);
  });

  readonly ventasTotales = computed(() =>
    this.pedidos().reduce((acc, pedido) => acc + pedido.total, 0),
  );

  readonly totalPaginasProductos = computed(() =>
    Math.max(1, Math.ceil(this.productos().length / this.itemsPorPagina())),
  );

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaProductos() - 1) * this.itemsPorPagina();

    return this.productos().slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly totalPaginasPedidos = computed(() =>
    Math.max(1, Math.ceil(this.pedidos().length / this.itemsPorPagina())),
  );

  readonly pedidosPaginados = computed(() => {
    const inicio = (this.paginaPedidos() - 1) * this.itemsPorPagina();

    return this.pedidos().slice(inicio, inicio + this.itemsPorPagina());
  });

  readonly itemsPedidoDetalle = computed(() => this.pedidoDetalle()?.items ?? []);

  constructor() {
    effect(() => {
      const tienda = this.tienda();
      this.notaInterna.set(tienda?.notaInterna ?? '');
    });
  }

  cambiarSeccion(seccion: SeccionDetalle): void {
    this.seccionActiva.set(seccion);
  }

  paginaAnteriorProductos(): void {
    if (this.paginaProductos() > 1) {
      this.paginaProductos.update((pagina) => pagina - 1);
    }
  }

  paginaSiguienteProductos(): void {
    if (this.paginaProductos() < this.totalPaginasProductos()) {
      this.paginaProductos.update((pagina) => pagina + 1);
    }
  }

  paginaAnteriorPedidos(): void {
    if (this.paginaPedidos() > 1) {
      this.paginaPedidos.update((pagina) => pagina - 1);
    }
  }

  paginaSiguientePedidos(): void {
    if (this.paginaPedidos() < this.totalPaginasPedidos()) {
      this.paginaPedidos.update((pagina) => pagina + 1);
    }
  }

  aprobar(): void {
    this.tiendasService.aprobarTienda(this.tiendaId);
    this.success.set('Tienda aprobada correctamente.');
  }

  abrirModalBloqueo(): void {
    this.motivoBloqueo.set('');
    this.modalBloquearAbierto.set(true);
  }

  confirmarBloqueo(): void {
    const motivo = this.motivoBloqueo().trim();

    if (!motivo) return;

    this.tiendasService.bloquearTienda(this.tiendaId, motivo);
    this.success.set('Tienda bloqueada correctamente.');
    this.modalBloquearAbierto.set(false);
    this.motivoBloqueo.set('');
  }

  cerrarModalBloqueo(): void {
    this.modalBloquearAbierto.set(false);
    this.motivoBloqueo.set('');
  }

  abrirModalRechazo(): void {
    this.motivoRechazo.set('');
    this.modalRechazarAbierto.set(true);
  }

  confirmarRechazo(): void {
    const motivo = this.motivoRechazo().trim();

    if (!motivo) return;

    this.tiendasService.rechazarTienda(this.tiendaId, motivo);
    this.success.set('Tienda rechazada correctamente.');
    this.modalRechazarAbierto.set(false);
    this.motivoRechazo.set('');
  }

  cerrarModalRechazo(): void {
    this.modalRechazarAbierto.set(false);
    this.motivoRechazo.set('');
  }

  desbloquear(): void {
    this.tiendasService.desbloquearTienda(this.tiendaId);
    this.success.set('Tienda desbloqueada correctamente.');
  }

  pasarAPendiente(): void {
    this.tiendasService.marcarTiendaPendiente(this.tiendaId);
    this.success.set('La tienda pasó a pendiente.');
  }

  guardarNota(): void {
    this.tiendasService.guardarNotaInterna(this.tiendaId, this.notaInterna());
    this.success.set('Nota interna guardada correctamente.');
  }

  abrirDetallePedido(pedido: any): void {
    this.pedidoDetalle.set(pedido);
    this.modalPedidoAbierto.set(true);
  }

  cerrarDetallePedido(): void {
    this.modalPedidoAbierto.set(false);
    this.pedidoDetalle.set(null);
  }
}