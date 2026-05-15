// ============================================================
// COMPONENTE: PedidosRecibidos (Tienda)
// Gestión de pedidos propios de la tienda: lista filtrable por
// estado y texto libre, con paginación y acceso al detalle
// de cada pedido para cambiar su estado.
// ============================================================

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PedidosService } from '../../../core/services/pedidos';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';
import { EstadoPedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-pedidos-recibidos',
  imports: [CurrencyPipe, RouterLink, AdminModal],
  templateUrl: './pedidos-recibidos.html',
  styleUrl: './pedidos-recibidos.css',
})
export class PedidosRecibidos implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);

  readonly currentUser = this.authService.currentUser;

  busqueda = signal('');
  estadoFiltro = signal('TODOS');
  paginaActual = signal(1);
  porPagina = signal(6);

  pedidoSeleccionado = signal<any | null>(null);
  modalEstadoAbierto = signal(false);

  readonly estados = [
    { valor: 'TODOS',          label: 'Todos' },
    { valor: 'PENDIENTE',      label: 'Pendiente' },
    { valor: 'EN_PREPARACION', label: 'En preparación' },
    { valor: 'ENVIADO',        label: 'Enviado' },
    { valor: 'ENTREGADO',      label: 'Entregado' },
    { valor: 'CANCELADO',      label: 'Cancelado' },
  ];

  readonly estadoLabels: Record<string, string> = {
    PENDIENTE:      'Pendiente',
    EN_PREPARACION: 'En preparación',
    ENVIADO:        'Enviado',
    ENTREGADO:      'Entregado',
    CANCELADO:      'Cancelado',
  };

  estadoLabel(estado: string): string {
    return this.estadoLabels[estado] ?? estado;
  }

  readonly pedidos = this.pedidosService.pedidos;

  readonly pedidosPendientes = computed(() =>
    this.pedidos().filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION')
  );

  readonly pedidosFiltrados = computed(() => {
    let lista = [...this.pedidos()];
    if (this.busqueda().trim()) {
      const texto = this.busqueda().toLowerCase();
      lista = lista.filter(p =>
        p.numeroPedido.toLowerCase().includes(texto) ||
        p.clienteEmail.toLowerCase().includes(texto)
      );
    }
    if (this.estadoFiltro() !== 'TODOS') {
      lista = lista.filter(p => p.estado === this.estadoFiltro());
    }
    return lista;
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.pedidosFiltrados().length / this.porPagina()))
  );

  readonly pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina();
    return this.pedidosFiltrados().slice(inicio, inicio + this.porPagina());
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user?.tiendaId) {
      this.pedidosService.cargarPorTienda(user.tiendaId);
    }
  }

  actualizarBusqueda(valor: string): void { this.busqueda.set(valor); this.paginaActual.set(1); }
  cambiarEstado(valor: string): void { this.estadoFiltro.set(valor); this.paginaActual.set(1); }
  paginaAnterior(): void { if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1); }

  abrirCambioEstado(pedido: any): void { this.pedidoSeleccionado.set(pedido); this.modalEstadoAbierto.set(true); }
  cerrarCambioEstado(): void { this.modalEstadoAbierto.set(false); this.pedidoSeleccionado.set(null); }

  confirmarCambioEstado(nuevoEstado: EstadoPedido): void {
    const pedido = this.pedidoSeleccionado();
    if (!pedido) return;
    this.pedidosService.actualizarEstadoPedido(pedido.id, nuevoEstado).subscribe({
      error: err => console.error('Error actualizando estado:', err)
    });
    this.cerrarCambioEstado();
  }
}
