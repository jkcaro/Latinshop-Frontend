// ============================================================
// LAYOUT: ClienteLayout
// Shell del panel de cliente. Gestiona el sidebar con el contador
// de carrito en tiempo real, el menú móvil y aplica el tema de
// color del cliente mediante ThemeService.
// ============================================================

import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Package,
  Store,
  ShoppingCart,
  ClipboardList,
  CircleUserRound,
  LogOut,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  X,
  Star,
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth';
import { CarritoService } from '../../../core/services/carrito';
import { ThemeService } from '../../../core/services/theme';

@Component({
  selector: 'app-cliente-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './cliente-layout.html',
  styleUrl: './cliente-layout.css',
})
export class ClienteLayout {
  private readonly authService = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly nombreUsuario = computed(() => this.currentUser()?.nombre ?? 'Cliente');
  readonly totalCarrito   = this.carritoService.totalItems;
  readonly mensajeCarrito = this.carritoService.mensaje;
  readonly mensajeExito   = this.carritoService.mensajeExito;

  cerrarMensaje(): void { this.carritoService.limpiarMensaje(); }
  cerrarExito():   void { this.carritoService.limpiarExito(); }

  cartoPulse = signal(false);

  constructor() {
    effect(() => {
      const total = this.totalCarrito();
      if (total > 0) {
        this.cartoPulse.set(true);
        setTimeout(() => this.cartoPulse.set(false), 400);
      }
    });
  }

  readonly HomeIcon         = LayoutDashboard;
  readonly ProductosIcon    = Package;
  readonly TiendasIcon      = Store;
  readonly CarritoIcon      = ShoppingCart;
  readonly PedidosIcon      = ClipboardList;
  readonly PerfilIcon       = CircleUserRound;
  readonly LogOutIcon       = LogOut;
  readonly HeadphonesIcon   = Headphones;
  readonly MailIcon         = Mail;
  readonly PhoneIcon        = Phone;
  readonly WhatsAppIcon     = MessageCircle;
  readonly CloseIcon        = X;
  readonly ResenasIcon      = Star;

  sidebarOpen   = signal(false);
  modalSoporte  = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  cerrarSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
