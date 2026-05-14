import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';
import { CarritoService } from '../../../core/services/carrito';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-detalle-producto',
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css',
})
export class DetalleProducto {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productosService = inject(ProductosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);

  readonly productoId = Number(this.route.snapshot.paramMap.get('id'));

  readonly enContextoCliente = this.router.url.startsWith('/cliente');
  readonly tiendaBase = this.enContextoCliente ? '/cliente/tiendas' : '/tiendas';
  readonly tiendasBase = this.enContextoCliente ? '/cliente/tiendas' : '/tiendas';
  readonly productosBase = this.enContextoCliente ? '/cliente/productos' : '/productos';

  readonly volverRuta: (string | number)[];
  readonly volverLabel: string;

  constructor() {
    const from = this.route.snapshot.queryParamMap.get('from');
    const tiendaId = this.route.snapshot.queryParamMap.get('tiendaId');
    if (from === 'tienda' && tiendaId) {
      this.volverRuta = [this.tiendaBase, tiendaId];
      this.volverLabel = '← Volver a la tienda';
    } else {
      this.volverRuta = [this.productosBase];
      this.volverLabel = '← Volver a Productos';
    }
  }

  readonly producto = computed(() =>
    this.productosService.obtenerPorId(this.productoId) ?? null,
  );

  readonly tienda = computed(() => {
    const producto = this.producto();
    if (!producto) return null;
    return this.tiendasService.obtenerPorId(producto.tiendaId) ?? null;
  });

  loginRequerido = signal(false);

  agregarAlCarrito(): void {
    this.loginRequerido.set(false);

    if (!this.authService.isCliente()) {
      this.loginRequerido.set(true);
      return;
    }

    const producto = this.producto();
    if (!producto || !producto.activo) return;

    this.carritoService.agregarProducto(producto);
  }
}
