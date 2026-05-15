// ============================================================
// LAYOUT: AdminLayout
// Shell de la sección de administración. Gestiona el sidebar
// colapsable, el menú móvil y aplica el tema de color del admin
// mediante ThemeService.
// ============================================================

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth';
import { ThemeService } from '../../../core/services/theme';
import {
  LucideAngularModule,
  LayoutDashboard,
  Store,
  Users,
  ChartBarBig,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LogOut,
  ShoppingCart,
  Star,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly adminName = computed(() => this.currentUser()?.nombre ?? 'Administrador');

  readonly LayoutDashboardIcon = LayoutDashboard;
  readonly StoreIcon = Store;
  readonly UsersIcon = Users;
  readonly FileBarChart2Icon = ChartBarBig;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronRightIcon = ChevronRight;
  readonly UserCircle2Icon = CircleUserRound;
  readonly LogOutIcon = LogOut;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly StarIcon = Star;

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    ),
    { initialValue: null },
  );

  readonly tiendasMenuOpen = signal(true);
  readonly pedidosMenuOpen = signal(true);
  readonly mobileMenuOpen = signal(false);

  readonly isTiendasRoute = computed(() => {
    const event = this.currentUrl();
    const url = event?.urlAfterRedirects ?? this.router.url;
    return url.startsWith('/admin/tiendas');
  });

  readonly isPedidosRoute = computed(() => {
    const event = this.currentUrl();
    const url = event?.urlAfterRedirects ?? this.router.url;
    return url.startsWith('/admin/pedidos');
  });

  toggleTiendasMenu(): void {
    this.tiendasMenuOpen.update((value) => !value);
  }

  togglePedidosMenu(): void {
    this.pedidosMenuOpen.update((value) => !value);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}