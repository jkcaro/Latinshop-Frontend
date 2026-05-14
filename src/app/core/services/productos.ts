import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:3000/api';

  private readonly _productos = signal<Producto[]>([]);
  private readonly _categorias = signal<{ id: number; nombre: string }[]>([]);

  readonly productos = this._productos.asReadonly();
  readonly categorias = this._categorias.asReadonly();
  readonly totalProductos = computed(() => this._productos().length);

  constructor() {
    this.cargarProductos();
    this.cargarCategorias();
  }

  private mapProducto(raw: any): Producto {
    return {
      id: raw.id,
      nombre: raw.nombre ?? '',
      marca: raw.marca ?? '',
      precio: Number(raw.precio),
      precioOferta: raw.precio_oferta != null ? Number(raw.precio_oferta) : null,
      categoria: raw.categoria_nombre ?? raw.categoria ?? '',
      paisOrigen: raw.pais_origen ?? '',
      descripcion: raw.descripcion ?? '',
      stock: raw.stock ?? 0,
      imagenUrl: raw.imagen_url ?? '',
      destacado: !!raw.destacado,
      activo: !!raw.activo,
      tiendaId: raw.tienda_id ?? 0
    };
  }

  private getCategoriaId(nombre: string): number {
    return this._categorias().find(c => c.nombre === nombre)?.id ?? 1;
  }

  cargarProductos(): void {
    this.http.get<any[]>(`${this.API}/productos`).subscribe({
      next: data => this._productos.set(data.map(p => this.mapProducto(p))),
      error: err => console.error('Error cargando productos:', err)
    });
  }

  private cargarCategorias(): void {
    this.http.get<any[]>(`${this.API}/categorias`).subscribe({
      next: data => this._categorias.set(data),
      error: err => console.error('Error cargando categorías:', err)
    });
  }

  getAll(): Observable<Producto[]> {
    return of(this._productos());
  }

  obtenerPorId(id: number): Producto | undefined {
    return this._productos().find(p => p.id === id);
  }

  obtenerDestacados(): Producto[] {
    return this._productos().filter(p => p.destacado && p.activo);
  }

  obtenerPorTienda(tiendaId: number): Producto[] {
    return this._productos().filter(p => p.tiendaId === tiendaId);
  }

  obtenerEnOferta(): Producto[] {
    return this._productos().filter(p => p.activo && p.precioOferta != null && p.precioOferta < p.precio);
  }

  crearProducto(producto: any): Observable<{ id: number }> {
    const body = {
      tienda_id: producto.tiendaId,
      categoria_id: producto.categoriaId ?? this.getCategoriaId(producto.categoria),
      nombre: producto.nombre,
      marca: producto.marca ?? '',
      pais_origen: producto.paisOrigen ?? '',
      descripcion: producto.descripcion ?? '',
      precio: producto.precio,
      precio_oferta: producto.precioOferta ?? null,
      stock: producto.stock ?? 0,
      imagen_url: producto.imagenUrl ?? '',
      destacado: producto.destacado ?? false
    };

    return this.http.post<{ id: number }>(`${this.API}/productos`, body).pipe(
      tap(resp => {
        const nuevo: Producto = {
          ...this.mapProducto({ ...body, id: resp.id, categoria_nombre: producto.categoria, tienda_id: producto.tiendaId, activo: 1 }),
          id: resp.id
        };
        this._productos.set([...this._productos(), nuevo]);
      })
    );
  }

  actualizarProducto(id: number, data: {
    nombre: string; marca: string; precio: number; precioOferta: number | null; categoria: string;
    categoriaId?: number;
    paisOrigen: string; descripcion: string; stock: number; imagenUrl: string; destacado: boolean;
  }): Observable<any> {
    const body = {
      nombre: data.nombre,
      marca: data.marca,
      precio: data.precio,
      precio_oferta: data.precioOferta ?? null,
      categoria_id: data.categoriaId ?? this.getCategoriaId(data.categoria),
      pais_origen: data.paisOrigen,
      descripcion: data.descripcion,
      stock: data.stock,
      imagen_url: data.imagenUrl,
      destacado: data.destacado
    };

    return this.http.put(`${this.API}/productos/${id}`, body).pipe(
      tap(() => {
        this._productos.set(
          this._productos().map(p =>
            p.id === id ? { ...p, ...data, precioOferta: data.precioOferta } : p
          )
        );
      })
    );
  }

  actualizarOferta(id: number, precioOferta: number | null): Observable<any> {
    return this.http.patch<{ precio_oferta: number | null }>(`${this.API}/productos/${id}/oferta`, { precio_oferta: precioOferta }).pipe(
      tap(resp => {
        this._productos.set(
          this._productos().map(p =>
            p.id === id ? { ...p, precioOferta: resp.precio_oferta ?? null } : p
          )
        );
      })
    );
  }

  eliminarProducto(id: number): void {
    this.http.delete(`${this.API}/productos/${id}`).subscribe({
      next: () => this._productos.set(this._productos().filter(p => p.id !== id)),
      error: err => console.error('Error eliminando producto:', err)
    });
  }

  cambiarEstadoProducto(id: number): void {
    this.http.patch(`${this.API}/productos/${id}/estado`, {}).subscribe({
      next: () => {
        const actualizados = this._productos().map(p =>
          p.id === id ? { ...p, activo: !p.activo } : p
        );
        this._productos.set(actualizados);
      },
      error: err => console.error('Error cambiando estado:', err)
    });
  }
}
