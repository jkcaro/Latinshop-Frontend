import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';
import { CarritoService } from '../../../core/services/carrito';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-lista-ofertas',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './lista-ofertas.html',
  styleUrl: './lista-ofertas.css',
})
export class ListaOfertas {
  private readonly productosService = inject(ProductosService);
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);

  readonly ofertas = computed(() => this.productosService.obtenerEnOferta());

  readonly porPagina = 8;
  paginaActual = signal(1);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.ofertas().length / this.porPagina))
  );

  readonly ofertasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.ofertas().slice(inicio, inicio + this.porPagina);
  });

  readonly mensajeCarrito = this.carritoService.mensaje;
  productoAgregadoId = signal<number | null>(null);
  loginRequerido = signal(false);

  readonly descuento = (precio: number, oferta: number) =>
    Math.round(((precio - oferta) / precio) * 100);

  agregarAlCarrito(productoId: number): void {
    this.loginRequerido.set(false);
    if (!this.authService.isCliente()) {
      this.loginRequerido.set(true);
      return;
    }
    const producto = this.productosService.obtenerPorId(productoId);
    if (!producto) return;
    this.carritoService.agregarProducto(producto);
    if (!this.mensajeCarrito()) {
      this.productoAgregadoId.set(productoId);
      setTimeout(() => this.productoAgregadoId.set(null), 1800);
    }
  }

  paginaAnterior(): void { this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { this.paginaActual.update(p => p + 1); }
}
