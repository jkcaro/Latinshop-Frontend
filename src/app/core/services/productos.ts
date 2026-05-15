// ============================================================
// SERVICIO: ProductosService
// Gestiona el catálogo global de productos del marketplace.
// Carga los productos y categorías al arrancar la app y los
// mantiene en un signal reactivo accesible en toda la SPA.
// Las operaciones de escritura (crear, editar, eliminar)
// actualizan el signal local sin necesidad de recargar la página.
// ============================================================
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Producto } from '../models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // Estado reactivo del catálogo y las categorías disponibles
  private readonly _productos  = signal<Producto[]>([]);
  private readonly _categorias = signal<{ id: number; nombre: string }[]>([]);

  // Señales públicas de solo lectura
  readonly productos      = this._productos.asReadonly();
  readonly categorias     = this._categorias.asReadonly();
  readonly totalProductos = computed(() => this._productos().length);

  constructor() {
    // Carga inicial automática al inyectar el servicio
    this.cargarProductos();
    this.cargarCategorias();
  }

  // Normaliza la respuesta del backend al modelo interno Producto
  private mapProducto(raw: any): Producto {
    return {
      id:           raw.id,
      nombre:       raw.nombre       ?? '',
      marca:        raw.marca        ?? '',
      precio:       Number(raw.precio),
      precioOferta: raw.precio_oferta != null ? Number(raw.precio_oferta) : null,
      categoria:    raw.categoria_nombre ?? raw.categoria ?? '',
      paisOrigen:   raw.pais_origen  ?? '',
      descripcion:  raw.descripcion  ?? '',
      stock:        raw.stock        ?? 0,
      imagenUrl:    raw.imagen_url   ?? '',
      destacado:    !!raw.destacado,
      activo:       !!raw.activo,
      tiendaId:     raw.tienda_id    ?? 0
    };
  }

  // Resuelve el ID de una categoría a partir de su nombre
  private getCategoriaId(nombre: string): number {
    return this._categorias().find(c => c.nombre === nombre)?.id ?? 1;
  }

  // ======================
  // CARGA DE DATOS
  // ======================

  // Obtiene todos los productos activos del marketplace
  cargarProductos(): void {
    this.http.get<any[]>(`${this.API}/productos`).subscribe({
      next: data => this._productos.set(data.map(p => this.mapProducto(p))),
      error: err  => console.error('Error cargando productos:', err)
    });
  }

  // Obtiene las categorías disponibles para el formulario de productos
  private cargarCategorias(): void {
    this.http.get<any[]>(`${this.API}/categorias`).subscribe({
      next: data => this._categorias.set(data),
      error: err  => console.error('Error cargando categorías:', err)
    });
  }

  // ======================
  // CONSULTAS
  // ======================

  getAll(): Observable<Producto[]> {
    return of(this._productos());
  }

  obtenerPorId(id: number): Producto | undefined {
    return this._productos().find(p => p.id === id);
  }

  // Devuelve los productos marcados como destacados y activos (para el home)
  obtenerDestacados(): Producto[] {
    return this._productos().filter(p => p.destacado && p.activo);
  }

  // Devuelve todos los productos de una tienda específica
  obtenerPorTienda(tiendaId: number): Producto[] {
    return this._productos().filter(p => p.tiendaId === tiendaId);
  }

  // Devuelve los productos con precio de oferta válido (precioOferta < precio)
  obtenerEnOferta(): Producto[] {
    return this._productos().filter(p => p.activo && p.precioOferta != null && p.precioOferta < p.precio);
  }

  // ======================
  // OPERACIONES DE ESCRITURA (Tienda / Admin)
  // ======================

  // Crea un nuevo producto en el backend y lo añade al signal local
  crearProducto(producto: any): Observable<{ id: number }> {
    const body = {
      tienda_id:    producto.tiendaId,
      categoria_id: producto.categoriaId ?? this.getCategoriaId(producto.categoria),
      nombre:       producto.nombre,
      marca:        producto.marca        ?? '',
      pais_origen:  producto.paisOrigen   ?? '',
      descripcion:  producto.descripcion  ?? '',
      precio:       producto.precio,
      precio_oferta:producto.precioOferta ?? null,
      stock:        producto.stock        ?? 0,
      imagen_url:   producto.imagenUrl    ?? '',
      destacado:    producto.destacado    ?? false
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

  // Edita un producto existente y actualiza el signal local
  actualizarProducto(id: number, data: {
    nombre: string; marca: string; precio: number; precioOferta: number | null; categoria: string;
    categoriaId?: number; paisOrigen: string; descripcion: string; stock: number;
    imagenUrl: string; destacado: boolean;
  }): Observable<any> {
    const body = {
      nombre:        data.nombre,
      marca:         data.marca,
      precio:        data.precio,
      precio_oferta: data.precioOferta ?? null,
      categoria_id:  data.categoriaId ?? this.getCategoriaId(data.categoria),
      pais_origen:   data.paisOrigen,
      descripcion:   data.descripcion,
      stock:         data.stock,
      imagen_url:    data.imagenUrl,
      destacado:     data.destacado
    };

    return this.http.put(`${this.API}/productos/${id}`, body).pipe(
      tap(() => {
        this._productos.set(
          this._productos().map(p => p.id === id ? { ...p, ...data, precioOferta: data.precioOferta } : p)
        );
      })
    );
  }

  // Actualiza solo el precio de oferta de un producto (acción rápida desde el panel)
  actualizarOferta(id: number, precioOferta: number | null): Observable<any> {
    return this.http.patch<{ precio_oferta: number | null }>(`${this.API}/productos/${id}/oferta`, { precio_oferta: precioOferta }).pipe(
      tap(resp => {
        this._productos.set(
          this._productos().map(p => p.id === id ? { ...p, precioOferta: resp.precio_oferta ?? null } : p)
        );
      })
    );
  }

  // Elimina un producto del backend y lo quita del signal local
  eliminarProducto(id: number): void {
    this.http.delete(`${this.API}/productos/${id}`).subscribe({
      next: () => this._productos.set(this._productos().filter(p => p.id !== id)),
      error: err  => console.error('Error eliminando producto:', err)
    });
  }

  // Activa o desactiva un producto (toggle) sin eliminarlo del catálogo
  cambiarEstadoProducto(id: number): void {
    this.http.patch(`${this.API}/productos/${id}/estado`, {}).subscribe({
      next: () => {
        this._productos.set(
          this._productos().map(p => p.id === id ? { ...p, activo: !p.activo } : p)
        );
      },
      error: err => console.error('Error cambiando estado:', err)
    });
  }
}
