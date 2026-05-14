import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { PedidosService } from '../../../core/services/pedidos';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-panel-tienda',
  templateUrl: './panel-tienda.html',
  styleUrl: './panel-tienda.css',
  imports: [CurrencyPipe, RouterLink],
})
export class PanelTienda implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly productosService = inject(ProductosService);
  private readonly pedidosService = inject(PedidosService);

  readonly currentUser = this.authService.currentUser;

  readonly tienda = computed(() => {
    const user = this.currentUser();
    if (!user || user.rol !== 'TIENDA') return null;
    return this.tiendasService.obtenerPorId(user.tiendaId!) ?? null;
  });

  readonly error = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Debes iniciar sesión.';
    if (user.rol !== 'TIENDA') return 'No tienes acceso a este panel.';
    const tienda = this.tienda();
    if (!tienda) return 'No se encontró la tienda.';
    if (tienda.estado !== 'APROBADA') return 'Tu tienda aún no ha sido aprobada.';
    return '';
  });

  readonly productos = computed(() => {
    const user = this.currentUser();
    if (!user?.tiendaId) return [];
    return this.productosService.obtenerPorTienda(user.tiendaId);
  });

  readonly pedidos = this.pedidosService.pedidos;

  readonly pedidosOrdenados = computed(() =>
    [...this.pedidos()].sort((a, b) =>
      new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
    )
  );

  readonly productosOrdenados = computed(() => [...this.productos()].reverse());

  readonly pedidosPendientes = computed(() =>
    this.pedidos().filter(p => p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION')
  );

  readonly ventasTotales = computed(() =>
    this.pedidos().reduce((acc, p) => acc + p.total, 0)
  );

  readonly ultimoPedido = computed(() => this.pedidosOrdenados()[0] ?? null);

  readonly actividad = computed(() => {
    const actividades: {
      tipo: 'pedido' | 'producto' | 'tienda';
      texto: string; tiempo: string; icono: string;
      color: 'blue' | 'red' | 'green';
    }[] = [];

    const pedido = this.ultimoPedido();
    if (pedido) actividades.push({ tipo: 'pedido', texto: `Nuevo pedido ${pedido.numeroPedido}`, tiempo: 'Último pedido recibido', icono: '🧾', color: 'blue' });

    const producto = this.productosOrdenados()[0];
    if (producto) actividades.push({ tipo: 'producto', texto: `Producto "${producto.nombre}" actualizado`, tiempo: 'Último producto registrado', icono: '📦', color: 'red' });

    if (this.tienda()?.estado === 'APROBADA') actividades.push({ tipo: 'tienda', texto: 'Tienda aprobada por administrador', tiempo: 'Estado actual', icono: '✔', color: 'green' });

    return actividades;
  });

  readonly totalProductos = computed(() => this.productos().length);
  readonly totalPedidos = computed(() => this.pedidos().length);

  ngOnInit(): void {
    const user = this.currentUser();
    if (user?.tiendaId) {
      this.pedidosService.cargarPorTienda(user.tiendaId);
    }
  }
}
