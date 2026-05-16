// ============================================================
// LAYOUT: TiendaLayout
// Shell del panel del propietario de tienda. Gestiona el sidebar
// con la navegación interna del negocio, el menú móvil y aplica
// el tema de color de la tienda mediante ThemeService.
// ============================================================

import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Package,
  PackagePlus,
  ClipboardList,
  CircleUserRound,
  LogOut,
  Headphones,
  Mail,
  Phone,
  MessageCircle,
  X,
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-tienda-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './tienda-layout.html',
  styleUrl: './tienda-layout.css',
})
export class TiendaLayout {
  private readonly authService   = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  readonly themeService           = inject(ThemeService);

  readonly currentUser  = this.authService.currentUser;
  readonly nombreTienda = computed(() => this.currentUser()?.nombre ?? 'Mi tienda');
  readonly imagenTienda = computed(() => {
    const id = this.currentUser()?.tiendaId;
    return id ? (this.tiendasService.obtenerPorId(id)?.imagenUrl ?? '') : '';
  });

  readonly HomeIcon         = LayoutDashboard;
  readonly ProductosIcon    = Package;
  readonly CrearIcon        = PackagePlus;
  readonly PedidosIcon      = ClipboardList;
  readonly PerfilIcon       = CircleUserRound;
  readonly LogOutIcon       = LogOut;
  readonly HeadphonesIcon   = Headphones;
  readonly MailIcon         = Mail;
  readonly PhoneIcon        = Phone;
  readonly WhatsAppIcon     = MessageCircle;
  readonly CloseIcon        = X;

  sidebarOpen  = signal(false);
  modalSoporte = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  cerrarSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
