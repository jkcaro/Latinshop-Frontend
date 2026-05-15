// ============================================================
// COMPONENTE: Home
// Página principal pública del marketplace. Muestra tiendas
// aprobadas, productos sin duplicar por nombre, carrusel de
// ofertas rotativo y buscador que redirige a lista-productos.
// ============================================================

import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductosService } from '../../core/services/productos';
import { TiendasService } from '../../core/services/tiendas';
import { CarritoService } from '../../core/services/carrito';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly productosService = inject(ProductosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly nombreUsuario = computed(() => this.authService.currentUser()?.nombre ?? null);

  readonly tiendas = computed(() => {
    const user = this.authService.currentUser();
    const todas = this.tiendasService.tiendasAprobadas();
    if (user?.rol === 'CLIENTE' && user.ciudadId) {
      return todas.filter(t => t.ciudadId === user.ciudadId);
    }
    return todas;
  });

  readonly productos = computed(() => {
    const user = this.authService.currentUser();
    const activos = this.productosService.productos().filter(p => p.activo);
    const base = (user?.rol === 'CLIENTE' && user.ciudadId)
      ? activos.filter(p => new Set(this.tiendas().map(t => t.id)).has(p.tiendaId))
      : activos;

    const contadorTienda = new Map<number, number>();
    const nombresVistos = new Set<string>();
    return base.filter(p => {
      const nombre = p.nombre.trim().toLowerCase();
      if (nombresVistos.has(nombre)) return false;
      const count = contadorTienda.get(p.tiendaId) ?? 0;
      if (count >= 3) return false;
      nombresVistos.add(nombre);
      contadorTienda.set(p.tiendaId, count + 1);
      return true;
    });
  });

  readonly productosEnOferta = computed(() => this.productosService.obtenerEnOferta());

  ofertaActivaIndex = signal(0);
  readonly ofertaActiva = computed(() => {
    const ofertas = this.productosEnOferta();
    return ofertas.length > 0 ? ofertas[this.ofertaActivaIndex() % ofertas.length] : null;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    const interval = setInterval(() => {
      const total = this.productosEnOferta().length;
      if (total > 1) this.ofertaActivaIndex.update(i => (i + 1) % total);
    }, 3000);
    destroyRef.onDestroy(() => clearInterval(interval));
  }

  readonly tiendasPaginadas = computed(() => this.tiendas().slice(0, 4));

  // Paginación productos
  readonly productosPorPagina = 8;
  paginaProductos = signal(1);
  readonly totalPaginasProductos = computed(() =>
    Math.max(1, Math.ceil(this.productos().length / this.productosPorPagina))
  );
  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaProductos() - 1) * this.productosPorPagina;
    return this.productos().slice(inicio, inicio + this.productosPorPagina);
  });

  readonly mensajeCarrito = this.carritoService.mensaje;
  loginRequerido = signal<number | null>(null);
  productoAgregadoId = signal<number | null>(null);

  readonly categorias = [
    { label: 'Harinas',    icon: '🌽', queryParams: { categoria: 'Harinas' } },
    { label: 'Bebidas',    icon: '🥤', queryParams: { categoria: 'Bebidas' } },
    { label: 'Dulces',     icon: '🍬', queryParams: { categoria: 'Dulces' } },
    { label: 'Snacks',     icon: '🍿', queryParams: { categoria: 'Snacks' } },
    { label: 'Enlatados',  icon: '🥫', queryParams: { categoria: 'Enlatados' } },
    { label: 'Congelados', icon: '❄️', queryParams: { categoria: 'Congelados' } },
    { label: 'Ver todas',  icon: '⊞', queryParams: {} },
  ];

  private readonly tiendaColores = [
    'linear-gradient(135deg, #f2994a, #eb5757)',
    'linear-gradient(135deg, #eb5757, #c0392b)',
    'linear-gradient(135deg, #f2994a, #e05a00)',
    'linear-gradient(135deg, #eb5757, #f2994a)',
    'linear-gradient(135deg, #e05a00, #eb5757)',
    'linear-gradient(135deg, #c0392b, #f2994a)',
  ];

  tiendaColor(id: number): string {
    return this.tiendaColores[id % this.tiendaColores.length];
  }

  agregarAlCarrito(productoId: number): void {
    this.loginRequerido.set(null);

    if (!this.authService.isCliente()) {
      this.loginRequerido.set(productoId);
      setTimeout(() => this.loginRequerido.set(null), 4000);
      return;
    }

    const producto = this.productosService.obtenerPorId(productoId);
    if (!producto || !producto.activo) return;

    this.carritoService.agregarProducto(producto);

    if (!this.mensajeCarrito()) {
      this.productoAgregadoId.set(productoId);
      setTimeout(() => this.productoAgregadoId.set(null), 1800);
    }
  }

  descuento(precio: number, oferta: number): number {
    return Math.round(((precio - oferta) / precio) * 100);
  }

  productoAnterior(): void { this.paginaProductos.update(p => p - 1); }
  productoSiguiente(): void { this.paginaProductos.update(p => p + 1); }

  buscar(q: string): void {
    if (q.trim()) this.router.navigate(['/productos'], { queryParams: { q: q.trim() } });
  }
}
