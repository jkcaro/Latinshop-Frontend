// ============================================================
// SERVICIO: CarritoService
// Gestiona el estado del carrito de compras con persistencia
// en localStorage por cliente. Aplica la regla de negocio
// que restringe el carrito a productos de una sola tienda.
// ============================================================
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { Producto } from '../models/producto.model';
import { CarritoItem } from '../models/carrito-item.model';
import { TiendasService } from './tiendas';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly authService    = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly platformId     = inject(PLATFORM_ID);

  // Estado interno del carrito
  private readonly _items = signal<CarritoItem[]>([]);

  // Mensajes de aviso (una tienda por pedido) y éxito (añadido al carrito)
  readonly mensaje      = signal('');
  readonly mensajeExito = signal<{ msg: string; id: number } | null>(null);

  // Timers para auto-cerrar los toasts
  private mensajeTimer: ReturnType<typeof setTimeout> | null = null;
  private exitoTimer:   ReturnType<typeof setTimeout> | null = null;
  private resetTimer:   ReturnType<typeof setTimeout> | null = null;
  private exitoId = 0;

  constructor() {
    // Carga sincrónica desde localStorage (solo en el navegador, no en SSR)
    if (isPlatformBrowser(this.platformId)) {
      const clienteId = this.authService.currentUser()?.clienteId;
      this._items.set(this.readStorage(this.keyFor(clienteId)));
    }

    // Reacciona a cambios de sesión (login / logout) para cargar el carrito correcto.
    // skip(1) omite la emisión inicial que ya maneja la carga sincrónica.
    toObservable(this.authService.currentUser)
      .pipe(skip(1))
      .subscribe(user => {
        const items = this.readStorage(this.keyFor(user?.clienteId));
        this._items.set(items);
        this.mensaje.set('');
      });
  }

  // Clave de localStorage por cliente — 'carrito_guest' si no hay sesión
  private keyFor(clienteId: number | null | undefined): string {
    return clienteId ? `carrito_${clienteId}` : 'carrito_guest';
  }

  private get storageKey(): string {
    return this.keyFor(this.authService.currentUser()?.clienteId);
  }

  limpiarMensaje(): void {
    if (this.mensajeTimer) clearTimeout(this.mensajeTimer);
    this.mensajeTimer = null;
    this.mensaje.set('');
  }

  limpiarExito(): void {
    if (this.exitoTimer) clearTimeout(this.exitoTimer);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.exitoTimer = null;
    this.resetTimer = null;
    this.mensajeExito.set(null);
  }

  // Señales públicas de solo lectura
  readonly items      = this._items.asReadonly();
  readonly totalItems = computed(() => this._items().reduce((acc, item) => acc + item.cantidad, 0));
  readonly totalCompra = computed(() =>
    Number(this._items().reduce((acc, item) => acc + item.subtotal, 0).toFixed(2))
  );

  readonly tiendaIdSeleccionada = computed(() => this._items()[0]?.producto.tiendaId ?? null);

  readonly nombreTiendaSeleccionada = computed(() => {
    const primerItem = this._items()[0];
    if (!primerItem) return '';
    const tienda = this.tiendasService.obtenerPorId(primerItem.producto.tiendaId);
    return tienda?.nombreNegocio ?? 'Tienda seleccionada';
  });

  // Lee y deserializa el carrito desde localStorage de forma segura
  private readStorage(key: string): CarritoItem[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as CarritoItem[]) : [];
    } catch {
      return [];
    }
  }

  // Guarda el carrito en localStorage (ignora errores de cuota)
  private persistItems(items: CarritoItem[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // localStorage lleno u otro error: no interrumpir la operación
    }
  }

  // ======================
  // OPERACIONES DEL CARRITO
  // ======================

  // Añade un producto al carrito.
  // Valida que no se mezclen productos de tiendas distintas (regla de negocio).
  // Devuelve false y muestra un aviso si el producto es de otra tienda.
  agregarProducto(producto: Producto): boolean {
    this.mensaje.set('');

    const itemsActuales = [...this._items()];

    // Validación: una sola tienda por pedido
    if (itemsActuales.length > 0 && itemsActuales.some(item => item.producto.tiendaId !== producto.tiendaId)) {
      this.mensaje.set('Solo puedes comprar productos de una misma tienda por pedido.');
      if (this.mensajeTimer) clearTimeout(this.mensajeTimer);
      this.mensajeTimer = setTimeout(() => this.mensaje.set(''), 5000);
      return false;
    }

    const index = itemsActuales.findIndex(item => item.producto.id === producto.id);

    if (index >= 0) {
      // Incrementa la cantidad si el producto ya existe en el carrito
      const itemExistente = itemsActuales[index];
      const nuevaCantidad = itemExistente.cantidad + 1;
      const precioEfectivo = itemExistente.producto.precioOferta ?? itemExistente.producto.precio;
      itemsActuales[index] = {
        ...itemExistente,
        cantidad: nuevaCantidad,
        subtotal: Number((precioEfectivo * nuevaCantidad).toFixed(2))
      };
    } else {
      // Agrega como nuevo ítem usando precio de oferta si existe
      const precioEfectivo = producto.precioOferta ?? producto.precio;
      itemsActuales.push({ producto, cantidad: 1, subtotal: Number(precioEfectivo.toFixed(2)) });
    }

    this._items.set(itemsActuales);
    this.persistItems(itemsActuales);

    // Muestra toast de éxito con un micro-delay para que se reactive correctamente
    if (this.exitoTimer) clearTimeout(this.exitoTimer);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.mensajeExito.set(null);
    this.resetTimer = setTimeout(() => {
      this.resetTimer = null;
      this.mensajeExito.set({ msg: producto.nombre, id: ++this.exitoId });
      this.exitoTimer = setTimeout(() => this.mensajeExito.set(null), 3000);
    }, 0);

    return true;
  }

  // Reduce en 1 la cantidad; elimina el ítem si llega a 0
  disminuirCantidad(productoId: number): void {
    const itemsActuales = [...this._items()];
    const index = itemsActuales.findIndex(item => item.producto.id === productoId);
    if (index === -1) return;

    const item = itemsActuales[index];
    if (item.cantidad <= 1) {
      this.eliminarProducto(productoId);
      return;
    }

    const nuevaCantidad  = item.cantidad - 1;
    const precioEfectivo = item.producto.precioOferta ?? item.producto.precio;
    itemsActuales[index] = {
      ...item,
      cantidad: nuevaCantidad,
      subtotal: Number((precioEfectivo * nuevaCantidad).toFixed(2))
    };

    this._items.set(itemsActuales);
    this.persistItems(itemsActuales);
  }

  // Elimina un producto del carrito por su ID
  eliminarProducto(productoId: number): void {
    const actualizados = this._items().filter(item => item.producto.id !== productoId);
    this._items.set(actualizados);
    this.persistItems(actualizados);
    if (actualizados.length === 0) this.mensaje.set('');
  }

  // Vacía el carrito completamente y limpia el localStorage
  vaciarCarrito(): void {
    this._items.set([]);
    this.persistItems([]);
    this.mensaje.set('');
  }
}
