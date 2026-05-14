import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';
import { PedidosService } from '../../../core/services/pedidos';
import { CarritoService } from '../../../core/services/carrito';
import { EstadoPedido } from '../../../core/models/pedido.model';

@Component({
  selector: 'app-panel-cliente',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './panel-cliente.html',
  styleUrl: './panel-cliente.css',
})
export class PanelCliente {
  private readonly authService = inject(AuthService);
  private readonly productosService = inject(ProductosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly pedidosService = inject(PedidosService);
  private readonly carritoService = inject(CarritoService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  private readonly ciudadCliente = computed(() => this.currentUser()?.ciudadId ?? null);

  private readonly ciudades = signal<{ id: number; nombre: string }[]>([]);
  readonly ciudadNombre = computed(() => {
    const id = this.ciudadCliente();
    if (!id) return 'España';
    return this.ciudades().find(c => c.id === id)?.nombre ?? 'España';
  });

  readonly tiendasDestacadas = computed(() => {
    const ciudad = this.ciudadCliente();
    return this.tiendasService
      .tiendas()
      .filter(t => t.activa && (!ciudad || t.ciudadId === ciudad))
      .slice(0, 4);
  });

  readonly productosPopulares = computed(() => {
    const ciudad = this.ciudadCliente();
    const tiendaIds = ciudad
      ? new Set(this.tiendasService.tiendas().filter(t => t.activa && t.ciudadId === ciudad).map(t => t.id))
      : null;
    return this.productosService
      .productos()
      .filter(p => p.activo && (!tiendaIds || tiendaIds.has(p.tiendaId)))
      .slice(0, 4);
  });

  readonly pedidosRecientes = computed(() => {
    const email = this.currentUser()?.email;
    if (!email) return [];
    return this.pedidosService.obtenerPorCliente(email).slice(-3).reverse();
  });

  readonly ENVIO_GRATIS_UMBRAL = 15;
  readonly subtotalCarrito = this.carritoService.totalCompra;
  readonly envioGratis = computed(() => this.subtotalCarrito() >= this.ENVIO_GRATIS_UMBRAL);
  readonly faltaParaEnvioGratis = computed(() =>
    Number(Math.max(0, this.ENVIO_GRATIS_UMBRAL - this.subtotalCarrito()).toFixed(2))
  );
  readonly progresoEnvioGratis = computed(() =>
    Math.min(100, Math.round((this.subtotalCarrito() / this.ENVIO_GRATIS_UMBRAL) * 100))
  );

  readonly productosEnOferta = computed(() => this.productosService.obtenerEnOferta());

  ofertaActivaIndex = signal(0);
  readonly ofertaActiva = computed(() => {
    const ofertas = this.productosEnOferta();
    return ofertas.length > 0 ? ofertas[this.ofertaActivaIndex() % ofertas.length] : null;
  });

  constructor() {
    const clienteId = this.currentUser()?.clienteId;
    if (clienteId) this.pedidosService.cargarPorCliente(clienteId);
    this.tiendasService.getCiudades().subscribe(c => this.ciudades.set(c));

    const destroyRef = inject(DestroyRef);
    const interval = setInterval(() => {
      const total = this.productosEnOferta().length;
      if (total > 1) this.ofertaActivaIndex.update(i => (i + 1) % total);
    }, 3000);
    destroyRef.onDestroy(() => clearInterval(interval));
  }

  readonly categorias = [
    { label: 'Harinas', icon: '🌽', queryParams: { categoria: 'Harinas' } },
    { label: 'Bebidas', icon: '🥤', queryParams: { categoria: 'Bebidas' } },
    { label: 'Dulces', icon: '🍬', queryParams: { categoria: 'Dulces' } },
    { label: 'Snacks', icon: '🍿', queryParams: { categoria: 'Snacks' } },
    { label: 'Enlatados', icon: '🥫', queryParams: { categoria: 'Enlatados' } },
    { label: 'Congelados', icon: '❄️', queryParams: { categoria: 'Congelados' } },
    { label: 'Ver todas', icon: '⊞', queryParams: {} },
  ];

  private readonly tiendaColores = [
    'linear-gradient(135deg, #1a1a2e, #16213e)',
    'linear-gradient(135deg, #2d1b69, #4a1942)',
    'linear-gradient(135deg, #7b1e1e, #c0392b)',
    'linear-gradient(135deg, #1a472a, #2d6a4f)',
    'linear-gradient(135deg, #1a3a5c, #2980b9)',
    'linear-gradient(135deg, #4a2c00, #a0522d)',
  ];

  tiendaColor(id: number): string {
    return this.tiendaColores[id % this.tiendaColores.length];
  }

  buscar(q: string): void {
    if (q.trim()) {
      this.router.navigate(['/cliente/productos'], { queryParams: { q: q.trim() } });
    }
  }

  agregarAlCarrito(productoId: number): void {
    const producto = this.productosService.obtenerPorId(productoId);
    if (producto) this.carritoService.agregarProducto(producto);
  }

  estadoLabel(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE: 'Procesando',
      EN_PREPARACION: 'En preparación',
      ENVIADO: 'En camino',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };
    return map[estado];
  }

  estadoClase(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      PENDIENTE: 'estado-procesando',
      EN_PREPARACION: 'estado-preparacion',
      ENVIADO: 'estado-camino',
      ENTREGADO: 'estado-entregado',
      CANCELADO: 'estado-cancelado',
    };
    return map[estado];
  }

  tiempoTranscurrido(fecha: string): string {
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Hace 1 día';
    return `Hace ${dias} días`;
  }
}
