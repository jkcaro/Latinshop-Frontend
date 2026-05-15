// ============================================================
// COMPONENTE: MisProductos (Tienda)
// Gestión del catálogo propio: filtra productos de la tienda
// autenticada, permite activar/desactivar, navegar a edición
// y eliminar con confirmación.
// ============================================================

import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ProductosService } from '../../../core/services/productos';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

@Component({
  selector: 'app-mis-productos',
  imports: [CurrencyPipe, RouterLink, AdminModal, FormsModule],
  templateUrl: './mis-productos.html',
  styleUrl: './mis-productos.css'
})
export class MisProductos {
  private readonly authService = inject(AuthService);
  private readonly productosService = inject(ProductosService);

  readonly tiendaActual = this.authService.currentUser;

  busqueda = signal('');
  categoriaFiltro = signal('TODAS');
  paginaActual = signal(1);
  productosPorPagina = signal(6);

  readonly misProductos = computed(() => {
    const user = this.tiendaActual();
    if (!user || user.rol !== 'TIENDA' || !user.tiendaId) return [];
    return this.productosService.obtenerPorTienda(user.tiendaId);
  });

  readonly categorias = computed(() => {
    const cats = this.misProductos().map(p => p.categoria);
    return Array.from(new Set(cats));
  });

  readonly productosFiltrados = computed(() => {
    let lista = [...this.misProductos()];
    if (this.busqueda().trim()) {
      const texto = this.busqueda().toLowerCase();
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto)
      );
    }
    if (this.categoriaFiltro() !== 'TODAS') {
      lista = lista.filter(p => p.categoria === this.categoriaFiltro());
    }
    return lista;
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.productosPorPagina()))
  );

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina();
    return this.productosFiltrados().slice(inicio, inicio + this.productosPorPagina());
  });

  actualizarBusqueda(valor: string): void { this.busqueda.set(valor); this.paginaActual.set(1); }
  cambiarCategoria(valor: string): void { this.categoriaFiltro.set(valor); this.paginaActual.set(1); }
  paginaAnterior(): void { if (this.paginaActual() > 1) this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { if (this.paginaActual() < this.totalPaginas()) this.paginaActual.update(p => p + 1); }

  ofertaInputs: Record<number, number | null> = {};
  ofertaMensajes: Record<number, string> = {};

  constructor() {
    effect(() => {
      this.misProductos().forEach(p => {
        if (!(p.id in this.ofertaInputs)) {
          this.ofertaInputs[p.id] = p.precioOferta;
        }
      });
    });
  }

  aplicarOferta(id: number): void {
    const val = this.ofertaInputs[id];
    this.productosService.actualizarOferta(id, val ?? null).subscribe({
      next: (resp) => {
        this.ofertaMensajes[id] = resp.precio_oferta
          ? `Oferta aplicada: ${resp.precio_oferta} €`
          : 'Oferta eliminada.';
        setTimeout(() => { this.ofertaMensajes[id] = ''; }, 2500);
      },
      error: () => { this.ofertaMensajes[id] = 'Error al aplicar oferta.'; }
    });
  }

  quitarOferta(id: number): void {
    this.ofertaInputs[id] = null;
    this.aplicarOferta(id);
  }

  modalEliminarAbierto = signal(false);
  productoEliminarId = signal<number | null>(null);

  abrirModalEliminar(id: number): void { this.productoEliminarId.set(id); this.modalEliminarAbierto.set(true); }
  cerrarModalEliminar(): void { this.modalEliminarAbierto.set(false); this.productoEliminarId.set(null); }

  confirmarEliminar(): void {
    const id = this.productoEliminarId();
    if (id === null) return;
    this.productosService.eliminarProducto(id);
    this.cerrarModalEliminar();
  }

  cambiarEstado(id: number): void {
    this.productosService.cambiarEstadoProducto(id);
  }
}
