import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';
import { CarritoService } from '../../../core/services/carrito';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-lista-productos',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css',
})
export class ListaProductos {
  private readonly productosService = inject(ProductosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  readonly categoriaActiva = computed(() => this.queryParams()['categoria'] ?? '');
  readonly textoBusqueda  = computed(() => this.queryParams()['q'] ?? '');

  private normalizar(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  readonly isClienteArea = computed(() => this.router.url.startsWith('/cliente'));
  readonly mensajeCarrito = this.carritoService.mensaje;
  productoAgregadoId = signal<number | null>(null);

  agregarAlCarrito(productoId: number): void {
    if (!this.authService.isCliente()) return;
    const producto = this.productosService.obtenerPorId(productoId);
    if (!producto) return;
    this.carritoService.agregarProducto(producto);
    if (!this.mensajeCarrito()) {
      this.productoAgregadoId.set(productoId);
      setTimeout(() => this.productoAgregadoId.set(null), 1800);
    }
  }

  readonly productos = computed(() => {
    const user = this.authService.currentUser();
    const activos = this.productosService.productos().filter(p => p.activo);
    if (user?.rol === 'CLIENTE' && user.ciudadId) {
      const tiendaIds = new Set(
        this.tiendasService.tiendasAprobadas()
          .filter(t => t.ciudadId === user.ciudadId)
          .map(t => t.id)
      );
      return activos.filter(p => tiendaIds.has(p.tiendaId));
    }
    return activos;
  });

  readonly productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    const q   = this.normalizar(this.textoBusqueda());
    const ordenados = [...this.productos()].sort((a, b) => a.nombre.localeCompare(b.nombre));

    let filtrados = cat ? ordenados.filter(p => p.categoria === cat) : ordenados;

    if (q) {
      filtrados = filtrados.filter(p =>
        this.normalizar(p.nombre).includes(q) ||
        this.normalizar(p.descripcion ?? '').includes(q) ||
        this.normalizar(p.marca ?? '').includes(q)
      );
      return filtrados;
    }

    if (cat) return filtrados;

    const contadorPorTienda = new Map<number, number>();
    return filtrados.filter(p => {
      const count = contadorPorTienda.get(p.tiendaId) ?? 0;
      if (count >= 3) return false;
      contadorPorTienda.set(p.tiendaId, count + 1);
      return true;
    });
  });

  readonly totalProductos = computed(() => this.productos().length);

  readonly productosPorPagina = 8;
  paginaActual = signal(1);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.productosPorPagina))
  );

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.productosPorPagina);
  });

  constructor() {
    effect(() => {
      this.categoriaActiva();
      this.paginaActual.set(1);
    });
  }

  paginaAnterior(): void { this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { this.paginaActual.update(p => p + 1); }

  irATiendas(): void {
    this.router.navigateByUrl('/tiendas');
  }
}
