import { Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { TiendasService } from '../../../core/services/tiendas';
import { ProductosService } from '../../../core/services/productos';
import { PedidosService } from '../../../core/services/pedidos';

@Component({
  selector: 'app-reportes',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly productosService = inject(ProductosService);
  private readonly pedidosService = inject(PedidosService);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.authService.cargarUsuarios();
    this.tiendasService.cargarTodasParaAdmin();
    this.pedidosService.cargarTodosLosPedidos();
  }

  readonly clientes = computed(() => this.authService.obtenerClientes());
  readonly tiendas = computed(() => this.tiendasService.obtenerTodasLasTiendas());
  readonly productos = this.productosService.productos;
  readonly pedidos = this.pedidosService.pedidos;

  readonly totalClientes = computed(() => this.clientes().length);

  readonly clientesAprobados = computed(
    () => this.clientes().filter((cliente) => cliente.estado !== 'BLOQUEADA').length,
  );

  readonly clientesBloqueados = computed(
    () => this.clientes().filter((cliente) => cliente.estado === 'BLOQUEADA').length,
  );

  readonly totalTiendas = computed(() => this.tiendas().length);

  readonly tiendasPendientes = computed(
    () => this.tiendas().filter((tienda) => tienda.estado === 'PENDIENTE').length,
  );

  readonly tiendasAprobadas = computed(
    () => this.tiendas().filter((tienda) => tienda.estado === 'APROBADA').length,
  );

  readonly tiendasRechazadas = computed(
    () => this.tiendas().filter((tienda) => tienda.estado === 'RECHAZADA').length,
  );

  readonly tiendasBloqueadas = computed(
    () => this.tiendas().filter((tienda) => tienda.estado === 'BLOQUEADA').length,
  );

  readonly totalProductos = computed(() => this.productos().length);

  readonly productosActivos = computed(
    () => this.productos().filter((producto) => producto.activo).length,
  );

  readonly productosInactivos = computed(
    () => this.productos().filter((producto) => !producto.activo).length,
  );

  readonly productosDestacados = computed(
    () => this.productos().filter((producto) => producto.destacado).length,
  );

  readonly productosPendientes = computed(() => this.productosInactivos());
  readonly productosAprobados = computed(() => this.productosActivos());
  readonly productosRechazados = computed(() => 0);

  readonly totalPedidos = computed(() => this.pedidos().length);

  readonly pedidosPendientes = computed(
    () => this.pedidos().filter((pedido) => pedido.estado === 'PENDIENTE').length,
  );

  readonly pedidosPreparacion = computed(
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

  readonly pedidosCompletados = computed(() => this.pedidosEntregados());

  readonly ventasTotales = computed(() =>
    this.pedidos().reduce((acc, pedido) => acc + pedido.total, 0),
  );

  readonly totalVentas = computed(() => this.ventasTotales());

  readonly ticketPromedio = computed(() => {
    if (this.totalPedidos() === 0) return 0;
    return this.ventasTotales() / this.totalPedidos();
  });
}
