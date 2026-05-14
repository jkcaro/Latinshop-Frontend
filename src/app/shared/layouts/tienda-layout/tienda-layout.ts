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

@Component({
  selector: 'app-tienda-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './tienda-layout.html',
  styleUrl: './tienda-layout.css',
})
export class TiendaLayout {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly nombreTienda = computed(() => this.currentUser()?.nombre ?? 'Mi tienda');

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
