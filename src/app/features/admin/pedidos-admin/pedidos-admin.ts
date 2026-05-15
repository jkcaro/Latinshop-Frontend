// ============================================================
// COMPONENTE: PedidosAdmin
// Vista de supervisión de todos los pedidos del marketplace.
// Permite filtrar por estado, tienda, fecha y texto libre,
// cambiar el estado del pedido con confirmación modal y ver
// el detalle completo de cada pedido.
// ============================================================

import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { PedidosService } from '../../../core/services/pedidos';
import { TiendasService } from '../../../core/services/tiendas';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

type EstadoFiltro =
  | 'TODOS'
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

type EstadoPedido = Exclude<EstadoFiltro, 'TODOS'>;

@Component({
  selector: 'app-pedidos-admin',
  imports: [CurrencyPipe, DatePipe, AdminModal],
  templateUrl: './pedidos-admin.html',
  styleUrl: './pedidos-admin.css',
})
export class PedidosAdmin {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidosService = inject(PedidosService);
  private readonly tiendasService = inject(TiendasService);

  private readonly _paramEstado = toSignal(
    this.route.queryParams.pipe(
      map((p) => (p['estado'] as EstadoFiltro) ?? 'TODOS'),
    ),
    { initialValue: 'TODOS' as EstadoFiltro },
  );

  readonly filtroEstado = signal<EstadoFiltro>('TODOS');
  readonly busqueda = signal('');
  readonly textoBusqueda = signal('');
  readonly fechaSeleccionada = signal('');
  readonly tiendaSeleccionada = signal('TODAS');

  readonly estadosTemporales = signal<Record<number, string>>({});
  readonly modalConfirmarEstado = signal(false);
  readonly pedidoEstadoSeleccionado = signal<any | null>(null);
  readonly nuevoEstadoSeleccionado = signal('');

  readonly paginaActual = signal(1);
  readonly pedidosPorPagina = signal(5);

  readonly modalPedidoAbierto = signal(false);
  readonly pedidoDetalle = signal<any | null>(null);
  readonly cargandoDetalle = signal(false);

  constructor() {
    this.pedidosService.cargarTodosLosPedidos();
    effect(() => {
      this.filtroEstado.set(this._paramEstado());
      this.paginaActual.set(1);
    });
  }

  readonly tiendasDisponibles = computed(() => this.tiendasService.obtenerTodasLasTiendas());

  readonly pedidos = computed(() =>
    this.pedidosService.pedidos().map((pedido) => {
      const tienda = this.tiendasService.obtenerPorId(pedido.tiendaId);

      return {
        ...pedido,
        nombreTienda: tienda?.nombreNegocio ?? 'Tienda desconocida',
      };
    }),
  );

  readonly totalPedidos = computed(() => this.pedidos().length);

  readonly pedidosPendientes = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'PENDIENTE').length,
  );

  readonly pedidosEnPreparacion = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'EN_PREPARACION').length,
  );

  readonly pedidosEnviados = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'ENVIADO').length,
  );

  readonly pedidosEntregados = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'ENTREGADO').length,
  );

  readonly pedidosCancelados = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'CANCELADO').length,
  );

  readonly pedidosFiltrados = computed(() => {
    const texto = this.normalizar(this.busqueda());
    let lista = this.pedidos();

    if (this.filtroEstado() !== 'TODOS') {
      lista = lista.filter((pedido) => pedido.estado === this.filtroEstado());
    }

    if (this.tiendaSeleccionada() !== 'TODAS') {
      lista = lista.filter((pedido) => pedido.tiendaId === Number(this.tiendaSeleccionada()));
    }

    if (this.fechaSeleccionada()) {
      const fechaFiltro = new Date(this.fechaSeleccionada());
      fechaFiltro.setHours(0, 0, 0, 0);

      lista = lista.filter((pedido) => {
        const fechaPedido = new Date(pedido.fechaPedido);
        fechaPedido.setHours(0, 0, 0, 0);

        return fechaPedido.getTime() === fechaFiltro.getTime();
      });
    }

    if (texto) {
      lista = lista.filter((pedido) => {
        const numeroPedido = this.normalizar(pedido.numeroPedido);
        const clienteEmail = this.normalizar(pedido.clienteEmail);
        const nombreTienda = this.normalizar(pedido.nombreTienda);

        const productos = pedido.items.some((item: any) =>
          this.normalizar(item.nombreProducto).includes(texto),
        );

        return (
          numeroPedido.includes(texto) ||
          clienteEmail.includes(texto) ||
          nombreTienda.includes(texto) ||
          productos
        );
      });
    }

    return lista.sort(
      (a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
    );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.pedidosFiltrados().length / this.pedidosPorPagina())),
  );

  readonly pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.pedidosPorPagina();
    const fin = inicio + this.pedidosPorPagina();

    return this.pedidosFiltrados().slice(inicio, fin);
  });

  readonly itemsPedidoDetalle = computed(() => this.pedidoDetalle()?.items ?? []);

  private normalizar(valor: unknown): string {
    return String(valor ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_\s]/g, '');
  }

  tooltipEstado(estado: string): string {
    const mensajes: Record<string, string> = {
      PENDIENTE: 'Pedido recibido, pendiente de preparación.',
      EN_PREPARACION: 'La tienda está preparando el pedido.',
      ENVIADO: 'El pedido ya fue enviado al cliente.',
      ENTREGADO: 'Pedido finalizado correctamente.',
      CANCELADO: 'Pedido cancelado.',
    };

    return mensajes[estado] ?? 'Estado del pedido';
  }

  cambiarFiltro(estado: EstadoFiltro): void {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  cambiarTienda(valor: string): void {
    this.tiendaSeleccionada.set(valor);
    this.paginaActual.set(1);
  }

  actualizarBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
  }

  actualizarFecha(valor: string): void {
    this.fechaSeleccionada.set(valor);
    this.paginaActual.set(1);
  }

  limpiarTodo(): void {
    this.busqueda.set('');
    this.textoBusqueda.set('');
    this.fechaSeleccionada.set('');
    this.filtroEstado.set('TODOS');
    this.tiendaSeleccionada.set('TODAS');
    this.paginaActual.set(1);
  }

  seleccionarEstadoTemporal(pedidoId: number, estado: string): void {
    this.estadosTemporales.update((actual) => ({
      ...actual,
      [pedidoId]: estado,
    }));
  }

  obtenerEstadoTemporal(pedidoId: number, estadoActual: string): string {
    return this.estadosTemporales()[pedidoId] ?? estadoActual;
  }

  abrirConfirmacionEstado(pedido: any): void {
    const nuevoEstado = this.obtenerEstadoTemporal(pedido.id, pedido.estado);

    if (nuevoEstado === pedido.estado) return;

    this.pedidoEstadoSeleccionado.set(pedido);
    this.nuevoEstadoSeleccionado.set(nuevoEstado);
    this.modalConfirmarEstado.set(true);
  }

  confirmarCambioEstado(): void {
    const pedido = this.pedidoEstadoSeleccionado();
    const estado = this.nuevoEstadoSeleccionado() as EstadoPedido;

    if (!pedido || !estado) return;

    this.pedidosService.actualizarEstadoPedido(pedido.id, estado).subscribe({
      error: err => console.error('Error actualizando estado:', err)
    });
    this.cerrarConfirmacionEstado();

    this.estadosTemporales.update((actual) => {
      const copia = { ...actual };
      delete copia[pedido.id];
      return copia;
    });
  }

  cerrarConfirmacionEstado(): void {
    this.modalConfirmarEstado.set(false);
    this.pedidoEstadoSeleccionado.set(null);
    this.nuevoEstadoSeleccionado.set('');
  }

  irPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;

    this.paginaActual.set(pagina);
  }

  paginaAnterior(): void {
    this.irPagina(this.paginaActual() - 1);
  }

  paginaSiguiente(): void {
    this.irPagina(this.paginaActual() + 1);
  }

  abrirDetallePedido(pedido: any): void {
    this.pedidoDetalle.set(pedido);
    this.modalPedidoAbierto.set(true);
    this.cargandoDetalle.set(true);
    this.pedidosService.obtenerDetallePedido(pedido.id).subscribe(full => {
      if (full) this.pedidoDetalle.set({ ...full, nombreTienda: pedido.nombreTienda });
      this.cargandoDetalle.set(false);
    });
  }

  cerrarDetallePedido(): void {
    this.modalPedidoAbierto.set(false);
    this.pedidoDetalle.set(null);
    this.cargandoDetalle.set(false);
  }
}
