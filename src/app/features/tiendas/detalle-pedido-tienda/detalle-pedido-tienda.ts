import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PedidosService } from '../../../core/services/pedidos';
import { EstadoPedido } from '../../../core/models/pedido.model';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';
import { MensajesPedido } from '../../../shared/components/mensajes-pedido/mensajes-pedido';

@Component({
  selector: 'app-detalle-pedido-tienda',
  imports: [CurrencyPipe, DatePipe, AdminModal, MensajesPedido],
  templateUrl: './detalle-pedido-tienda.html',
  styleUrl: './detalle-pedido-tienda.css',
})
export class DetallePedidoTienda implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidosService = inject(PedidosService);

  readonly pedidoId = Number(this.route.snapshot.paramMap.get('id'));
  readonly pedido = computed(() => this.pedidosService.obtenerPorId(this.pedidoId));

  success = signal('');
  error = signal('');
  cargando = signal(false);
  modalEstadoAbierto = signal(false);
  nuevoEstado = signal<EstadoPedido>('PENDIENTE');

  ngOnInit(): void {
    this.pedidosService.cargarPedidoCompleto(this.pedidoId);
  }

  abrirModalEstado(estado: EstadoPedido): void {
    this.nuevoEstado.set(estado);
    this.modalEstadoAbierto.set(true);
  }

  cerrarModalEstado(): void {
    this.modalEstadoAbierto.set(false);
    this.nuevoEstado.set('PENDIENTE');
  }

  confirmarEstado(): void {
    const pedido = this.pedido();
    if (!pedido) return;

    this.cargando.set(true);
    this.success.set('');
    this.error.set('');

    this.pedidosService.actualizarEstadoPedido(pedido.id, this.nuevoEstado()).subscribe({
      next: () => {
        this.success.set(`Estado actualizado a: ${this.nuevoEstado()}`);
        this.cargando.set(false);
        this.cerrarModalEstado();
      },
      error: () => {
        this.error.set('No se pudo actualizar el estado. Verifica la conexión.');
        this.cargando.set(false);
        this.cerrarModalEstado();
      }
    });
  }
}
