import { CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, PLATFORM_ID, ViewChild, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chart } from 'chart.js/auto';
import {
  CheckCircle,
  Clock,
  LucideAngularModule,
  PackageCheck,
  ShoppingBag,
  Store,
  UserPlus,
  UserRound,
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth';
import { PedidosService } from '../../../core/services/pedidos';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';
import { ThemeService, Theme } from '../../../core/services/theme';

@Component({
  selector: 'app-dashboard-admin',
  imports: [CurrencyPipe, DatePipe, RouterLink, LucideAngularModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit, AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  readonly themeService = inject(ThemeService);

  setTheme(t: Theme): void { this.themeService.setAdminTheme(t); }
  private readonly productosService = inject(ProductosService);
  private readonly pedidosService = inject(PedidosService);

  @ViewChild('ventasChart') ventasChart!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  readonly CheckCircleIcon = CheckCircle;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly ClockIcon = Clock;
  readonly UserRoundIcon = UserRound;

  readonly PackageCheckIcon = PackageCheck;
  readonly StoreIcon = Store;
  readonly UserPlusIcon = UserPlus;

  readonly currentUser = this.authService.currentUser;

  readonly totalTiendas = computed(() => this.tiendasService.obtenerTodasLasTiendas().length);
  readonly tiendasPendientes = computed(() => this.tiendasService.tiendasPendientes().length);
  readonly totalProductos = computed(() => this.productosService.productos().length);
  readonly totalPedidos = computed(() => this.pedidosService.pedidos().length);
  readonly totalClientes = computed(() => this.authService.clientes().length);

  readonly ventasTotales = computed(() =>
    this.pedidosService.pedidos().reduce((total, pedido) => total + pedido.total, 0),
  );

  readonly resumenUltimos7Dias = computed(() => {
    const hoy = new Date();
    const inicio = new Date();

    inicio.setDate(hoy.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);

    const pedidos = this.pedidosService.pedidos().filter((pedido) => {
      const fecha = new Date(pedido.fechaPedido);
      return fecha >= inicio && fecha <= hoy;
    });

    const ventas = pedidos.reduce((total, pedido) => total + pedido.total, 0);

    return {
      ventas,
      pedidos: pedidos.length,
      clientesNuevos: this.authService.clientes().length,
      ticketPromedio: pedidos.length ? ventas / pedidos.length : 0,
    };
  });

  readonly ventasPorDia = computed(() => {
    const dias: { label: string; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);

      const clave = fecha.toISOString().slice(0, 10);

      const total = this.pedidosService
        .pedidos()
        .filter((pedido) => pedido.fechaPedido.startsWith(clave))
        .reduce((acumulado, pedido) => acumulado + pedido.total, 0);

      dias.push({
        label: fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        }),
        total,
      });
    }

    return dias;
  });

  readonly actividadReciente = computed(() => {
    const pedidos = [...this.pedidosService.pedidos()].sort(
      (a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
    );

    const tiendasAprobadas = [...this.tiendasService.tiendas()]
      .filter((t) => t.estado === 'APROBADA')
      .sort((a, b) => b.id - a.id);

    const usuarios = [...this.authService.clientes()].sort((a, b) => b.id - a.id);

    const actividad: any[] = [];

    const ultimaTienda = tiendasAprobadas[0];
    if (ultimaTienda) {
      actividad.push({
        tipo: 'tienda',
        texto: `Tienda "${ultimaTienda.nombreNegocio}" aprobada`,
        fecha: new Date(),
      });
    }

    const ultimoUsuario = usuarios[0];
    if (ultimoUsuario) {
      actividad.push({
        tipo: 'usuario',
        texto: 'Nuevo usuario registrado',
        fecha: new Date(),
      });
    }

    const ultimoPedido = pedidos[0];
    if (ultimoPedido) {
      actividad.push({
        tipo: 'pedido',
        texto: `Nuevo pedido ${ultimoPedido.numeroPedido}`,
        fecha: ultimoPedido.fechaPedido,
      });
    }

    return actividad
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5);
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.authService.cargarUsuarios();
    this.tiendasService.cargarTodasParaAdmin();
    this.pedidosService.cargarTodosLosPedidos();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.crearGrafica();
    }
  }

  private crearGrafica(): void {
    const datos = this.ventasPorDia();

    this.chart?.destroy();

    this.chart = new Chart(this.ventasChart.nativeElement, {
      type: 'line',
      data: {
        labels: datos.map((dia) => dia.label),
        datasets: [
          {
            data: datos.map((dia) => dia.total),
            borderColor: '#eb5757',
            backgroundColor: 'rgba(235, 87, 87, 0.12)',
            tension: 0.45,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#eb5757',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
}
