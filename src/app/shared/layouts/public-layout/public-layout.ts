import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Package,
  Store,
  LogOut,
  UserRound,
  UserPlus,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  X,
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth';
import { CarritoService } from '../../../core/services/carrito';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  private readonly authService   = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  private readonly router         = inject(Router);

  readonly HomeIcon       = LayoutDashboard;
  readonly ProductosIcon  = Package;
  readonly TiendasIcon    = Store;
  readonly LogOutIcon     = LogOut;
  readonly AccesoIcon     = UserRound;
  readonly RegistroIcon   = UserPlus;
  readonly HeadphonesIcon = Headphones;
  readonly MailIcon       = Mail;
  readonly PhoneIcon      = Phone;
  readonly WhatsAppIcon   = MessageCircle;
  readonly CloseIcon      = X;

  readonly isLoggedIn  = this.authService.isLoggedIn;
  readonly currentUser = this.authService.currentUser;
  readonly isCliente   = this.authService.isCliente;
  readonly isTienda    = this.authService.isTienda;

  readonly mensajeCarrito = this.carritoService.mensaje;
  readonly mensajeExito   = this.carritoService.mensajeExito;

  cerrarMensaje(): void { this.carritoService.limpiarMensaje(); }
  cerrarExito():   void { this.carritoService.limpiarExito(); }

  sidebarOpen  = signal(false);
  modalSoporte = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarOpen.set(false);
  }

  irAPanel(): void {
    if (this.isTienda()) {
      this.router.navigateByUrl('/tienda');
    } else if (this.isCliente()) {
      this.router.navigateByUrl('/cliente');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
