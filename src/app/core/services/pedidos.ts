// ============================================================
// SERVICIO: PedidosService
// Centraliza la carga, creación y actualización de pedidos.
// Un único signal _pedidos sirve a cliente, tienda y admin;
// cada área filtra por clienteId, tiendaId o sin filtro (todos).
// ============================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Pedido, MetodoEnvio, MetodoPago, EstadoPedido } from '../models/pedido.model';
import { CarritoItem } from '../models/carrito-item.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  private readonly _pedidos = signal<Pedido[]>([]);

  readonly pedidos = this._pedidos.asReadonly();
  readonly totalPedidos = () => this._pedidos().length;

  private mapPedido(raw: any): Pedido {
    const items = Array.isArray(raw.items)
      ? raw.items.filter((i: any) => i && i.producto_id).map((i: any) => ({
          productoId:     i.producto_id,
          nombreProducto: i.nombre_producto ?? '',
          precioUnitario: Number(i.precio_unitario),
          cantidad:       i.cantidad,
          subtotal:       Number(i.subtotal),
          imagenUrl:      i.imagen_url ?? undefined
        }))
      : [];

    const historial = Array.isArray(raw.historial)
      ? raw.historial.map((h: any) => ({
          estado:     h.estado ?? '',
          comentario: h.comentario ?? '',
          fecha:      h.fecha ?? ''
        }))
      : [];

    return {
      id: raw.id,
      numeroPedido: raw.numero_pedido ?? '',
      clienteEmail: raw.cliente_email ?? '',
      tiendaId: raw.tienda_id ?? 0,
      tiendaNombre: raw.tienda_nombre ?? '',
      estado: (raw.estado ?? 'PENDIENTE') as EstadoPedido,
      metodoPago: (raw.metodo_pago ?? 'TARJETA') as MetodoPago,
      metodoEnvio: (raw.metodo_envio ?? 'ESTANDAR') as MetodoEnvio,
      estadoPago: (raw.estado_pago ?? 'PAGADO') as any,
      subtotal: Number(raw.subtotal),
      costoEnvio: Number(raw.costo_envio),
      iva: Number(raw.iva),
      total: Number(raw.total),
      direccionEnvio: raw.direccion_envio ?? '',
      ciudadEnvio: raw.ciudad_envio ?? '',
      codigoPostalEnvio: raw.codigo_postal_envio ?? '',
      fechaPedido: raw.fecha_pedido ?? new Date().toISOString(),
      items,
      historial
    };
  }

  cargarPorCliente(clienteId: number): void {
    this.http.get<any[]>(`${this.API}/pedidos?cliente_id=${clienteId}`).subscribe({
      next: data => this._pedidos.set(data.map(p => this.mapPedido(p))),
      error: err => console.error('Error cargando pedidos del cliente:', err)
    });
  }

  cargarPorTienda(tiendaId: number): void {
    this.http.get<any[]>(`${this.API}/pedidos?tienda_id=${tiendaId}`).subscribe({
      next: data => this._pedidos.set(data.map(p => this.mapPedido(p))),
      error: err => console.error('Error cargando pedidos de la tienda:', err)
    });
  }

  cargarTodosLosPedidos(): void {
    this.http.get<any[]>(`${this.API}/admin/pedidos`).subscribe({
      next: data => this._pedidos.set(data.map(p => this.mapPedido(p))),
      error: err => console.error('Error cargando todos los pedidos:', err)
    });
  }

  cargarPedidoCompleto(id: number): void {
    this.http.get<any>(`${this.API}/pedidos/${id}`).subscribe({
      next: raw => {
        const pedido = this.mapPedido(raw);
        const lista = this._pedidos();
        const idx = lista.findIndex(p => p.id === id);
        if (idx >= 0) {
          const copia = [...lista];
          copia[idx] = pedido;
          this._pedidos.set(copia);
        } else {
          this._pedidos.set([...lista, pedido]);
        }
      },
      error: err => console.error('Error cargando detalle de pedido:', err)
    });
  }

  obtenerDetallePedido(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/pedidos/${id}`).pipe(
      map(raw => this.mapPedido(raw)),
      catchError(() => of(null))
    );
  }

  obtenerPorId(id: number): Pedido | undefined {
    return this._pedidos().find(p => p.id === id);
  }

  obtenerPorCliente(email: string): Pedido[] {
    return this._pedidos().filter(p => p.clienteEmail === email);
  }

  obtenerPorTienda(tiendaId: number): Pedido[] {
    return this._pedidos().filter(p => p.tiendaId === tiendaId);
  }

  crearPedido(data: {
    clienteEmail: string;
    direccionEnvio: string;
    ciudadEnvio: string;
    codigoPostalEnvio: string;
    metodoPago: MetodoPago;
    metodoEnvio: MetodoEnvio;
    aceptaCondicionesCompra: boolean;
    items: CarritoItem[];
  }): Observable<{ numeroPedido: string; pedidoId: number; total: number; error: string }> {
    const user = this.getStoredUser();
    if (!user?.clienteId) {
      return of({ numeroPedido: '', pedidoId: 0, total: 0, error: '' });
    }

    const tiendaId = data.items.length > 0 ? data.items[0].producto.tiendaId : 1;

    const body = {
      cliente_id: user.clienteId,
      tienda_id: tiendaId,
      direccion_envio: data.direccionEnvio,
      ciudad_envio: data.ciudadEnvio,
      codigo_postal_envio: data.codigoPostalEnvio,
      metodo_pago: data.metodoPago,
      metodo_envio: data.metodoEnvio,
      acepta_condiciones_compra: data.aceptaCondicionesCompra,
      items: data.items.map(item => ({
        producto_id: item.producto.id,
        nombre_producto: item.producto.nombre,
        precio_unitario: item.producto.precio,
        cantidad: item.cantidad
      }))
    };

    return this.http.post<{ pedidoId: number; numeroPedido: string; total: number }>(
      `${this.API}/pedidos`, body
    ).pipe(
      map(resp => {
        this.cargarPorCliente(user.clienteId!);
        return { ...resp, error: '' };
      }),
      catchError(err => {
        const msg = err.error?.message ?? 'Error al crear el pedido. Intenta de nuevo.';
        return of({ numeroPedido: '', pedidoId: 0, total: 0, error: msg });
      })
    );
  }

  actualizarEstadoPedido(id: number, estado: EstadoPedido): Observable<void> {
    return this.http.put<void>(`${this.API}/pedidos/${id}/estado`, { estado }).pipe(
      map(() => {
        const actualizados = this._pedidos().map(p =>
          p.id === id ? { ...p, estado } : p
        );
        this._pedidos.set(actualizados);
      }),
      catchError(err => {
        console.error('Error actualizando estado del pedido:', err);
        throw err;
      })
    );
  }

  private getStoredUser(): { clienteId?: number; tiendaId?: number } | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }
}
