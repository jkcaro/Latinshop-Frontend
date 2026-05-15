// ============================================================
// COMPONENTE: Carrito
// Flujo de checkout de dos pasos: visualización y edición del
// carrito, luego formulario de dirección y método de pago.
// Genera el pedido mediante PedidosService y limpia el carrito
// tras confirmación exitosa.
// ============================================================

import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShoppingCart, Trash2, ShieldCheck, Truck, Package, Headphones, ClipboardList, CreditCard, Lock, MapPin } from 'lucide-angular';
import { CarritoService } from '../../../core/services/carrito';
import { PedidosService } from '../../../core/services/pedidos';
import { AuthService } from '../../../core/services/auth';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-carrito',
  imports: [CurrencyPipe, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css'
})
export class Carrito {
  readonly ShoppingCart  = ShoppingCart;
  readonly Trash2        = Trash2;
  readonly ShieldCheck   = ShieldCheck;
  readonly Truck         = Truck;
  readonly Package       = Package;
  readonly Headphones    = Headphones;
  readonly ClipboardList = ClipboardList;
  readonly CreditCard    = CreditCard;
  readonly Lock          = Lock;
  readonly MapPin        = MapPin;

  private readonly carritoService = inject(CarritoService);
  private readonly pedidosService = inject(PedidosService);
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);

  readonly items = this.carritoService.items;
  readonly totalItems = this.carritoService.totalItems;
  readonly subtotal = this.carritoService.totalCompra;
  readonly mensaje = this.carritoService.mensaje;
  readonly nombreTiendaSeleccionada = this.carritoService.nombreTiendaSeleccionada;
  readonly tiendaIdActual = computed(() => this.items()[0]?.producto.tiendaId ?? null);

  cerrarMensaje(): void { this.carritoService.limpiarMensaje(); }

  direccionEnvio = signal('');
  ciudadEnvio = signal('');
  codigoPostalEnvio = signal('');
  metodoPago = signal<'TARJETA' | 'PAYPAL' | 'BIZUM' | 'TRANSFERENCIA' | 'CONTRA_ENTREGA'>('TARJETA');
  metodoEnvio = signal<'ESTANDAR' | 'EXPRESS' | 'RECOGIDA_TIENDA'>('ESTANDAR');

  aceptaLegal = signal(false);
  error = signal('');
  success = signal('');
  loading = signal(false);
  modalEnvio = signal(false);
  ciudadToast = signal(false);
  alertToast  = signal('');

  private ciudadToastTimer: ReturnType<typeof setTimeout> | null = null;
  private alertToastTimer:  ReturnType<typeof setTimeout> | null = null;

  mostrarToastCiudad(): void {
    if (this.ciudadToastTimer) clearTimeout(this.ciudadToastTimer);
    this.ciudadToast.set(true);
    this.ciudadToastTimer = setTimeout(() => this.ciudadToast.set(false), 5000);
  }

  cerrarToastCiudad(): void {
    if (this.ciudadToastTimer) clearTimeout(this.ciudadToastTimer);
    this.ciudadToast.set(false);
  }

  mostrarAlertToast(msg: string): void {
    if (this.alertToastTimer) clearTimeout(this.alertToastTimer);
    this.alertToast.set(msg);
    this.alertToastTimer = setTimeout(() => this.alertToast.set(''), 4000);
  }

  cerrarAlertToast(): void {
    if (this.alertToastTimer) clearTimeout(this.alertToastTimer);
    this.alertToast.set('');
  }

  private readonly tiendaEnvioConfig = computed(() => {
    const tiendaId = this.tiendaIdActual();
    if (!tiendaId) return { activo: false, umbral: 15 };
    try {
      const raw = localStorage.getItem(`tienda_envio_gratis_${tiendaId}`);
      if (!raw) return { activo: false, umbral: 15 };
      return JSON.parse(raw) as { activo: boolean; umbral: number };
    } catch { return { activo: false, umbral: 15 }; }
  });

  readonly envioGratisActivo = computed(() => this.tiendaEnvioConfig().activo);
  readonly ENVIO_GRATIS_UMBRAL = computed(() => this.tiendaEnvioConfig().umbral);

  readonly envioGratis = computed(() =>
    this.envioGratisActivo() && this.subtotal() >= this.ENVIO_GRATIS_UMBRAL()
  );

  readonly faltaParaEnvioGratis = computed(() => {
    if (!this.envioGratisActivo()) return 0;
    return Number(Math.max(0, this.ENVIO_GRATIS_UMBRAL() - this.subtotal()).toFixed(2));
  });

  readonly progresoEnvioGratis = computed(() => {
    if (!this.envioGratisActivo()) return 0;
    return Math.min(100, Math.round((this.subtotal() / this.ENVIO_GRATIS_UMBRAL()) * 100));
  });

  readonly costoEnvio = computed(() => {
    if (this.items().length === 0) return 0;
    switch (this.metodoEnvio()) {
      case 'EXPRESS': return 5.5;
      case 'RECOGIDA_TIENDA': return 0;
      default: return this.envioGratis() ? 0 : 2.5;
    }
  });

  readonly iva = computed(() => Number((this.subtotal() * 0.21).toFixed(2)));

  readonly totalCompra = computed(() =>
    Number((this.subtotal() + this.costoEnvio() + this.iva()).toFixed(2))
  );

  aumentar(productoId: number): void {
    const item = this.items().find(i => i.producto.id === productoId);
    if (item) this.carritoService.agregarProducto(item.producto);
  }

  disminuir(productoId: number): void { this.carritoService.disminuirCantidad(productoId); }
  eliminar(productoId: number): void { this.carritoService.eliminarProducto(productoId); }

  vaciar(): void {
    this.carritoService.vaciarCarrito();
    this.error.set('');
    this.success.set('');
  }

  onMetodoEnvioChange(value: 'ESTANDAR' | 'EXPRESS' | 'RECOGIDA_TIENDA'): void {
    this.metodoEnvio.set(value);
    if (value === 'RECOGIDA_TIENDA') {
      this.direccionEnvio.set('');
      this.ciudadEnvio.set('');
      this.codigoPostalEnvio.set('');
    }
  }

  confirmarPedido(): void {
    this.error.set('');
    this.success.set('');

    const user = this.authService.currentUser();

    if (!user || user.rol !== 'CLIENTE') {
      this.error.set('Debes iniciar sesión como cliente para completar la compra.');
      return;
    }

    if (!user.clienteId) {
      this.error.set('Error de sesión. Vuelve a iniciar sesión.');
      return;
    }

    if (this.items().length === 0) {
      this.error.set('El carrito está vacío.');
      return;
    }

    if (user.ciudadId) {
      const tiendaId = this.items()[0].producto.tiendaId;
      const tienda = this.tiendasService.obtenerPorId(tiendaId);
      if (tienda && tienda.ciudadId && tienda.ciudadId !== user.ciudadId) {
        this.mostrarToastCiudad();
        return;
      }
    }

    if (
      this.metodoEnvio() !== 'RECOGIDA_TIENDA' &&
      (!this.direccionEnvio().trim() || !this.ciudadEnvio().trim() || !this.codigoPostalEnvio().trim())
    ) {
      this.mostrarAlertToast('Completa todos los datos de envío.');
      return;
    }

    if (!this.aceptaLegal()) {
      this.error.set('Debes leer y aceptar la política de privacidad y las condiciones de compra para continuar.');
      return;
    }

    this.loading.set(true);

    this.pedidosService.crearPedido({
      clienteEmail: user.email,
      direccionEnvio: this.metodoEnvio() === 'RECOGIDA_TIENDA' ? 'RECOGIDA EN TIENDA' : this.direccionEnvio(),
      ciudadEnvio: this.metodoEnvio() === 'RECOGIDA_TIENDA' ? 'RECOGIDA EN TIENDA' : this.ciudadEnvio(),
      codigoPostalEnvio: this.metodoEnvio() === 'RECOGIDA_TIENDA' ? '00000' : this.codigoPostalEnvio(),
      metodoPago: this.metodoPago(),
      metodoEnvio: this.metodoEnvio(),
      aceptaCondicionesCompra: this.aceptaLegal(),
      items: this.items()
    }).subscribe(result => {
      this.loading.set(false);

      if (result.error) {
        this.error.set(result.error);
        return;
      }

      if (!result.pedidoId) {
        this.error.set('Error al crear el pedido. Intenta de nuevo.');
        return;
      }

      this.success.set(`Pedido ${result.numeroPedido} creado correctamente.`);
      this.carritoService.vaciarCarrito();

      this.direccionEnvio.set('');
      this.ciudadEnvio.set('');
      this.codigoPostalEnvio.set('');
      this.metodoPago.set('TARJETA');
      this.metodoEnvio.set('ESTANDAR');
      this.aceptaLegal.set(false);

      setTimeout(() => this.router.navigateByUrl('/cliente/pedidos'), 1000);
    });
  }
}
