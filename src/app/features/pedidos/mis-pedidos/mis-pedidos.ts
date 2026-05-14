import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { PedidosService } from '../../../core/services/pedidos';
import { EstadoPedido, Pedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-mis-pedidos',
  imports: [CurrencyPipe, DatePipe, RouterLink, FormsModule],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit {
  private readonly authService    = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);

  readonly currentUser = this.authService.currentUser;

  textoBusqueda = signal('');
  estadoFiltro  = signal('');
  periodoFiltro = signal('6m');

  readonly pedidosFiltrados = computed(() => {
    let lista = this.pedidosService.pedidos();

    const texto = this.textoBusqueda().trim().toLowerCase();
    if (texto) lista = lista.filter(p => p.numeroPedido.toLowerCase().includes(texto));

    const estado = this.estadoFiltro();
    if (estado) lista = lista.filter(p => p.estado === estado);

    const periodo = this.periodoFiltro();
    if (periodo !== 'todos') {
      const meses: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
      const corte = new Date();
      corte.setMonth(corte.getMonth() - (meses[periodo] ?? 6));
      lista = lista.filter(p => new Date(p.fechaPedido) >= corte);
    }

    return lista;
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user?.clienteId) {
      this.pedidosService.cargarPorCliente(user.clienteId);
    }
  }

  estadoLabel(estado: EstadoPedido): string {
    const m: Record<EstadoPedido, string> = {
      PENDIENTE:      'Pendiente',
      EN_PREPARACION: 'En preparación',
      ENVIADO:        'Enviado',
      ENTREGADO:      'Entregado',
      CANCELADO:      'Cancelado',
    };
    return m[estado] ?? estado;
  }

  estadoDescripcion(pedido: Pedido): string {
    switch (pedido.estado) {
      case 'PENDIENTE':      return 'Tu pedido está pendiente de confirmación';
      case 'EN_PREPARACION': return 'Estamos preparando tu pedido';
      case 'ENVIADO':        return 'Tu pedido está en camino';
      case 'ENTREGADO':      return 'Tu pedido ha sido entregado';
      case 'CANCELADO':      return 'Pedido cancelado';
      default:               return '';
    }
  }

  botonLabel(estado: EstadoPedido): string {
    return (estado === 'PENDIENTE' || estado === 'EN_PREPARACION' || estado === 'ENVIADO')
      ? 'Ver seguimiento'
      : 'Ver detalle';
  }
}
