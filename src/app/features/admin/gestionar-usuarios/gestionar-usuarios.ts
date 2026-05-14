import { CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth';
import { PedidosService } from '../../../core/services/pedidos';
import { TiendasService } from '../../../core/services/tiendas';
import { AdminModal } from '../../../shared/components/admin-modal/admin-modal';

@Component({
  selector: 'app-gestionar-usuarios',
  imports: [AdminModal, CurrencyPipe, DatePipe],
  templateUrl: './gestionar-usuarios.html',
  styleUrl: './gestionar-usuarios.css',
})
export class GestionarUsuarios implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);
  private readonly tiendasService = inject(TiendasService);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.authService.cargarUsuarios();
    this.pedidosService.cargarTodosLosPedidos();
  }

  readonly menuAbierto = signal<number | null>(null);
  readonly modalDetalleAbierto = signal(false);
  readonly usuarioDetalle = signal<any | null>(null);
  readonly mesFiltro = signal('TODOS');
  readonly itemsPorPedido = signal<Record<number, any[]>>({});

  readonly modalBloqueoAbierto = signal(false);
  readonly usuarioBloqueo = signal<any | null>(null);

  readonly paginaClientes = signal(1);
  readonly clientesPorPagina = signal(5);

  readonly admin = computed(() => ({
    id: 1,
    nombre: 'Administrador',
    email: 'admin@latinshop.com',
    rol: 'ADMIN',
    estado: 'APROBADA',
  }));

  readonly usuarios = computed(() =>
    this.authService.clientes().map((cliente) => ({
      ...cliente,
      rol: 'CLIENTE',
      estado: cliente.estado ?? 'APROBADA',
    })),
  );

  readonly totalPaginasClientes = computed(() =>
    Math.max(1, Math.ceil(this.usuarios().length / this.clientesPorPagina())),
  );

  readonly clientesPaginados = computed(() => {
    const inicio = (this.paginaClientes() - 1) * this.clientesPorPagina();

    return this.usuarios().slice(inicio, inicio + this.clientesPorPagina());
  });

  readonly pedidosClienteSeleccionado = computed(() => {
    const usuario = this.usuarioDetalle();

    if (!usuario) return [];

    let pedidos = this.pedidosService
      .pedidos()
      .filter((pedido) => pedido.clienteEmail === usuario.email)
      .map((pedido) => {
        const tienda = this.tiendasService.tiendas().find((item) => item.id === pedido.tiendaId);

        return {
          ...pedido,
          nombreTienda: tienda?.nombreNegocio || 'Tienda desconocida',
        };
      });

    if (this.mesFiltro() !== 'TODOS') {
      pedidos = pedidos.filter((pedido) => {
        const fecha = new Date(pedido.fechaPedido);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        return mes === this.mesFiltro();
      });
    }

    return pedidos.sort(
      (a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
    );
  });

  readonly mesesDisponiblesCliente = computed(() => {
    const usuario = this.usuarioDetalle();

    if (!usuario) return [];

    const meses = this.pedidosService
      .pedidos()
      .filter((pedido) => pedido.clienteEmail === usuario.email)
      .map((pedido) => {
        const fecha = new Date(pedido.fechaPedido);

        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      });

    return Array.from(new Set(meses)).sort().reverse();
  });

  paginaAnteriorClientes(): void {
    if (this.paginaClientes() > 1) {
      this.paginaClientes.update((pagina) => pagina - 1);
    }
  }

  paginaSiguienteClientes(): void {
    if (this.paginaClientes() < this.totalPaginasClientes()) {
      this.paginaClientes.update((pagina) => pagina + 1);
    }
  }

  toggleMenu(id: number): void {
    this.menuAbierto.set(this.menuAbierto() === id ? null : id);
  }

  verDetalle(usuario: any): void {
    this.usuarioDetalle.set(usuario);
    this.mesFiltro.set('TODOS');
    this.menuAbierto.set(null);
    this.modalDetalleAbierto.set(true);
    this.itemsPorPedido.set({});

    const pedidosUsuario = this.pedidosService.pedidos()
      .filter(p => p.clienteEmail === usuario.email);

    pedidosUsuario.forEach(pedido => {
      this.pedidosService.obtenerDetallePedido(pedido.id).subscribe(full => {
        if (full) {
          this.itemsPorPedido.update(map => ({ ...map, [pedido.id]: full.items ?? [] }));
        }
      });
    });
  }

  cerrarModal(): void {
    this.modalDetalleAbierto.set(false);
    this.usuarioDetalle.set(null);
    this.mesFiltro.set('TODOS');
    this.itemsPorPedido.set({});
  }

  abrirConfirmacionBloqueo(usuario: any): void {
    this.usuarioBloqueo.set(usuario);
    this.modalBloqueoAbierto.set(true);
    this.menuAbierto.set(null);
  }

  getItemsPedido(pedidoId: number): any[] {
    return this.itemsPorPedido()[pedidoId] ?? [];
  }

  cerrarConfirmacionBloqueo(): void {
    this.modalBloqueoAbierto.set(false);
    this.usuarioBloqueo.set(null);
  }

  confirmarBloqueo(): void {
    const usuario = this.usuarioBloqueo();

    if (!usuario) return;

    this.authService.cambiarEstadoCliente(usuario.id);
    this.cerrarConfirmacionBloqueo();
  }
}
