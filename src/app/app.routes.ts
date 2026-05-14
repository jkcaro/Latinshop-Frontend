import { Routes } from '@angular/router';
import { clienteGuard } from './core/guards/cliente-guard';
import { tiendaGuard } from './core/guards/tienda-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  // ── Públicas (con Navbar + Footer via PublicLayout) ──
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/lista-productos/lista-productos').then(
            (m) => m.ListaProductos,
          ),
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./features/productos/detalle-producto/detalle-producto').then(
            (m) => m.DetalleProducto,
          ),
      },
      {
        path: 'tiendas',
        loadComponent: () =>
          import('./features/tiendas/lista-tiendas/lista-tiendas').then((m) => m.ListaTiendas),
      },
      {
        path: 'tiendas/:id',
        loadComponent: () =>
          import('./features/tiendas/detalle-tienda/detalle-tienda').then((m) => m.DetalleTienda),
      },
      {
        path: 'ofertas',
        loadComponent: () =>
          import('./features/productos/lista-ofertas/lista-ofertas').then((m) => m.ListaOfertas),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'registro-cliente',
        loadComponent: () =>
          import('./features/auth/registro-cliente/registro-cliente').then(
            (m) => m.RegistroCliente,
          ),
      },
      {
        path: 'registro-tienda',
        loadComponent: () =>
          import('./features/auth/registro-tienda/registro-tienda').then((m) => m.RegistroTienda),
      },
      {
        path: 'recuperar-password',
        loadComponent: () =>
          import('./features/auth/recuperar-password/recuperar-password').then(
            (m) => m.RecuperarPassword,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
      },
      // ── Páginas legales ──
      {
        path: 'aviso-legal',
        loadComponent: () =>
          import('./features/legal/aviso-legal/aviso-legal').then((m) => m.AvisoLegal),
      },
      {
        path: 'politica-privacidad',
        loadComponent: () =>
          import('./features/legal/politica-privacidad/politica-privacidad').then(
            (m) => m.PoliticaPrivacidad,
          ),
      },
      {
        path: 'condiciones-uso',
        loadComponent: () =>
          import('./features/legal/condiciones-uso/condiciones-uso').then((m) => m.CondicionesUso),
      },
      {
        path: 'politica-cookies',
        loadComponent: () =>
          import('./features/legal/politica-cookies/politica-cookies').then(
            (m) => m.PoliticaCookies,
          ),
      },
      {
        path: 'condiciones-compra',
        loadComponent: () =>
          import('./features/legal/condiciones-compra/condiciones-compra').then(
            (m) => m.CondicionesCompra,
          ),
      },
    ],
  },

  // ── Cliente ──
  {
    path: 'cliente',
    canActivate: [clienteGuard],
    loadComponent: () =>
      import('./shared/layouts/cliente-layout/cliente-layout').then((m) => m.ClienteLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'panel',
      },
      {
        path: 'panel',
        loadComponent: () =>
          import('./features/cliente/panel-cliente/panel-cliente').then((m) => m.PanelCliente),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/lista-productos/lista-productos').then(
            (m) => m.ListaProductos,
          ),
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./features/productos/detalle-producto/detalle-producto').then(
            (m) => m.DetalleProducto,
          ),
      },
      {
        path: 'tiendas',
        loadComponent: () =>
          import('./features/tiendas/lista-tiendas/lista-tiendas').then((m) => m.ListaTiendas),
      },
      {
        path: 'tiendas/:id',
        loadComponent: () =>
          import('./features/tiendas/detalle-tienda/detalle-tienda').then((m) => m.DetalleTienda),
      },
      {
        path: 'ofertas',
        loadComponent: () =>
          import('./features/productos/lista-ofertas/lista-ofertas').then((m) => m.ListaOfertas),
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./features/carrito/carrito/carrito').then((m) => m.Carrito),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/pedidos/mis-pedidos/mis-pedidos').then((m) => m.MisPedidos),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./features/pedidos/detalle-pedido/detalle-pedido').then((m) => m.DetallePedido),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/cliente/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
      },
      {
        path: 'mis-resenas',
        loadComponent: () =>
          import('./features/cliente/mis-resenas/mis-resenas').then((m) => m.MisResenas),
      },
    ],
  },

  // ── Tienda ──
  {
    path: 'tienda',
    canActivate: [tiendaGuard],
    loadComponent: () =>
      import('./shared/layouts/tienda-layout/tienda-layout').then((m) => m.TiendaLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'panel',
      },
      {
        path: 'panel',
        loadComponent: () =>
          import('./features/tiendas/panel-tienda/panel-tienda').then((m) => m.PanelTienda),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/tiendas/mi-perfil-tienda/mi-perfil-tienda').then(
            (m) => m.MiPerfilTienda,
          ),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/tiendas/mis-productos/mis-productos').then((m) => m.MisProductos),
      },
      {
        path: 'productos/crear',
        loadComponent: () =>
          import('./features/tienda/crear-producto/crear-producto').then((m) => m.CrearProducto),
      },
      {
        path: 'productos/editar/:id',
        loadComponent: () =>
          import('./features/tiendas/editar-producto/editar-producto').then(
            (m) => m.EditarProducto,
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/tiendas/pedidos-recibidos/pedidos-recibidos').then(
            (m) => m.PedidosRecibidos,
          ),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./features/tiendas/detalle-pedido-tienda/detalle-pedido-tienda').then(
            (m) => m.DetallePedidoTienda,
          ),
      },
    ],
  },

  // ── Admin ──
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./shared/layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin),
      },
      {
        path: 'tiendas',
        loadComponent: () =>
          import('./features/admin/gestionar-tiendas/gestionar-tiendas').then(
            (m) => m.GestionarTiendas,
          ),
      },
      {
        path: 'tiendas/:id',
        loadComponent: () =>
          import('./features/admin/detalle-tienda-admin/detalle-tienda-admin').then(
            (m) => m.DetalleTiendaAdmin,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/gestionar-usuarios/gestionar-usuarios').then(
            (m) => m.GestionarUsuarios,
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/admin/reportes/reportes').then((m) => m.Reportes),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/admin/pedidos-admin/pedidos-admin').then((m) => m.PedidosAdmin),
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./features/admin/detalle-producto-admin/detalle-producto-admin').then(
            (m) => m.DetalleProductoAdmin,
          ),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./features/admin/detalle-pedido-admin/detalle-pedido-admin').then(
            (m) => m.DetallePedidoAdmin,
          ),
      },
      {
        path: 'resenas',
        loadComponent: () =>
          import('./features/admin/moderar-resenas/moderar-resenas').then((m) => m.ModerarResenas),
      },
    ],
  },

  // ── Fallback ──
  {
    path: '**',
    redirectTo: '',
  },
];