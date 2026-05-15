import { Routes } from '@angular/router';
import { clienteGuard } from './core/guards/cliente-guard';
import { tiendaGuard } from './core/guards/tienda-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

  // ===============================
  // RUTA PADRE: Área pública
  // Accesible sin autenticación.
  // Usa PublicLayout (sidebar + footer compartido).
  // ===============================
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/public-layout/public-layout').then((m) => m.PublicLayout),

    // RUTAS HIJAS: se renderizan dentro del <router-outlet> del PublicLayout
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },

      // Catálogo de productos y tiendas
      { path: 'productos',    loadComponent: () => import('./features/productos/lista-productos/lista-productos').then((m) => m.ListaProductos) },
      { path: 'productos/:id',loadComponent: () => import('./features/productos/detalle-producto/detalle-producto').then((m) => m.DetalleProducto) },
      { path: 'tiendas',      loadComponent: () => import('./features/tiendas/lista-tiendas/lista-tiendas').then((m) => m.ListaTiendas) },
      { path: 'tiendas/:id',  loadComponent: () => import('./features/tiendas/detalle-tienda/detalle-tienda').then((m) => m.DetalleTienda) },
      { path: 'ofertas',      loadComponent: () => import('./features/productos/lista-ofertas/lista-ofertas').then((m) => m.ListaOfertas) },

      // Autenticación
      { path: 'login',              loadComponent: () => import('./features/auth/login/login').then((m) => m.Login) },
      { path: 'registro-cliente',   loadComponent: () => import('./features/auth/registro-cliente/registro-cliente').then((m) => m.RegistroCliente) },
      { path: 'registro-tienda',    loadComponent: () => import('./features/auth/registro-tienda/registro-tienda').then((m) => m.RegistroTienda) },
      { path: 'recuperar-password', loadComponent: () => import('./features/auth/recuperar-password/recuperar-password').then((m) => m.RecuperarPassword) },
      { path: 'reset-password',     loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword) },

      // Páginas legales (RGPD / LOPD)
      { path: 'aviso-legal',        loadComponent: () => import('./features/legal/aviso-legal/aviso-legal').then((m) => m.AvisoLegal) },
      { path: 'politica-privacidad',loadComponent: () => import('./features/legal/politica-privacidad/politica-privacidad').then((m) => m.PoliticaPrivacidad) },
      { path: 'condiciones-uso',    loadComponent: () => import('./features/legal/condiciones-uso/condiciones-uso').then((m) => m.CondicionesUso) },
      { path: 'politica-cookies',   loadComponent: () => import('./features/legal/politica-cookies/politica-cookies').then((m) => m.PoliticaCookies) },
      { path: 'condiciones-compra', loadComponent: () => import('./features/legal/condiciones-compra/condiciones-compra').then((m) => m.CondicionesCompra) },
    ],
  },

  // ===============================
  // RUTA PADRE: Área de cliente
  // Protegida por clienteGuard (requiere rol CLIENTE).
  // Usa ClienteLayout con sidebar y carrito en la navegación.
  // ===============================
  {
    path: 'cliente',
    canActivate: [clienteGuard],
    loadComponent: () =>
      import('./shared/layouts/cliente-layout/cliente-layout').then((m) => m.ClienteLayout),

    // RUTAS HIJAS: se renderizan dentro del <router-outlet> del ClienteLayout
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },

      // Panel principal del cliente
      { path: 'panel', loadComponent: () => import('./features/cliente/panel-cliente/panel-cliente').then((m) => m.PanelCliente) },

      // Catálogo (mismo componente que el área pública, dentro del layout cliente)
      { path: 'productos',    loadComponent: () => import('./features/productos/lista-productos/lista-productos').then((m) => m.ListaProductos) },
      { path: 'productos/:id',loadComponent: () => import('./features/productos/detalle-producto/detalle-producto').then((m) => m.DetalleProducto) },
      { path: 'tiendas',      loadComponent: () => import('./features/tiendas/lista-tiendas/lista-tiendas').then((m) => m.ListaTiendas) },
      { path: 'tiendas/:id',  loadComponent: () => import('./features/tiendas/detalle-tienda/detalle-tienda').then((m) => m.DetalleTienda) },
      { path: 'ofertas',      loadComponent: () => import('./features/productos/lista-ofertas/lista-ofertas').then((m) => m.ListaOfertas) },

      // Carrito y proceso de compra
      { path: 'carrito', loadComponent: () => import('./features/carrito/carrito/carrito').then((m) => m.Carrito) },

      // Gestión de pedidos del cliente
      { path: 'pedidos',    loadComponent: () => import('./features/pedidos/mis-pedidos/mis-pedidos').then((m) => m.MisPedidos) },
      { path: 'pedidos/:id',loadComponent: () => import('./features/pedidos/detalle-pedido/detalle-pedido').then((m) => m.DetallePedido) },

      // Perfil y reseñas
      { path: 'perfil',      loadComponent: () => import('./features/cliente/mi-perfil/mi-perfil').then((m) => m.MiPerfil) },
      { path: 'mis-resenas', loadComponent: () => import('./features/cliente/mis-resenas/mis-resenas').then((m) => m.MisResenas) },
    ],
  },

  // ===============================
  // RUTA PADRE: Área de tienda
  // Protegida por tiendaGuard (requiere rol TIENDA y tienda aprobada).
  // Usa TiendaLayout con gestión de productos y pedidos recibidos.
  // ===============================
  {
    path: 'tienda',
    canActivate: [tiendaGuard],
    loadComponent: () =>
      import('./shared/layouts/tienda-layout/tienda-layout').then((m) => m.TiendaLayout),

    // RUTAS HIJAS: se renderizan dentro del <router-outlet> del TiendaLayout
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },

      // Panel principal de la tienda
      { path: 'panel',  loadComponent: () => import('./features/tiendas/panel-tienda/panel-tienda').then((m) => m.PanelTienda) },
      { path: 'perfil', loadComponent: () => import('./features/tiendas/mi-perfil-tienda/mi-perfil-tienda').then((m) => m.MiPerfilTienda) },

      // Gestión de productos (listar, crear, editar)
      { path: 'productos',           loadComponent: () => import('./features/tiendas/mis-productos/mis-productos').then((m) => m.MisProductos) },
      { path: 'productos/crear',     loadComponent: () => import('./features/tienda/crear-producto/crear-producto').then((m) => m.CrearProducto) },
      { path: 'productos/editar/:id',loadComponent: () => import('./features/tiendas/editar-producto/editar-producto').then((m) => m.EditarProducto) },

      // Pedidos recibidos en la tienda
      { path: 'pedidos',    loadComponent: () => import('./features/tiendas/pedidos-recibidos/pedidos-recibidos').then((m) => m.PedidosRecibidos) },
      { path: 'pedidos/:id',loadComponent: () => import('./features/tiendas/detalle-pedido-tienda/detalle-pedido-tienda').then((m) => m.DetallePedidoTienda) },
    ],
  },

  // ===============================
  // RUTA PADRE: Área de administración
  // Protegida por adminGuard (requiere rol ADMIN).
  // Usa AdminLayout con panel completo de supervisión del marketplace.
  // ===============================
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./shared/layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),

    // RUTAS HIJAS: se renderizan dentro del <router-outlet> del AdminLayout
    children: [
      // Dashboard principal con KPIs globales
      { path: '', loadComponent: () => import('./features/admin/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin) },

      // Gestión de tiendas (aprobar, bloquear, rechazar)
      { path: 'tiendas',    loadComponent: () => import('./features/admin/gestionar-tiendas/gestionar-tiendas').then((m) => m.GestionarTiendas) },
      { path: 'tiendas/:id',loadComponent: () => import('./features/admin/detalle-tienda-admin/detalle-tienda-admin').then((m) => m.DetalleTiendaAdmin) },

      // Gestión de usuarios registrados
      { path: 'usuarios', loadComponent: () => import('./features/admin/gestionar-usuarios/gestionar-usuarios').then((m) => m.GestionarUsuarios) },

      // Supervisión de pedidos del marketplace
      { path: 'pedidos',    loadComponent: () => import('./features/admin/pedidos-admin/pedidos-admin').then((m) => m.PedidosAdmin) },
      { path: 'pedidos/:id',loadComponent: () => import('./features/admin/detalle-pedido-admin/detalle-pedido-admin').then((m) => m.DetallePedidoAdmin) },

      // Detalle de producto desde el panel admin
      { path: 'productos/:id', loadComponent: () => import('./features/admin/detalle-producto-admin/detalle-producto-admin').then((m) => m.DetalleProductoAdmin) },

      // Moderación de reseñas de clientes
      { path: 'resenas', loadComponent: () => import('./features/admin/moderar-resenas/moderar-resenas').then((m) => m.ModerarResenas) },

      // Informes y estadísticas globales
      { path: 'reportes', loadComponent: () => import('./features/admin/reportes/reportes').then((m) => m.Reportes) },
    ],
  },

  // ── Cualquier ruta desconocida redirige al inicio ──
  { path: '**', redirectTo: '' },
];