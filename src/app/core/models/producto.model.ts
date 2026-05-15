// ============================================================
// MODELO: Producto
// Representa un artículo del catálogo de una tienda. precioOferta
// es null cuando no hay descuento activo. activo controla si es
// visible en el catálogo público; destacado lo marca como featured.
// ============================================================

export interface Producto {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  precioOferta: number | null;
  categoria: string;
  paisOrigen: string;
  descripcion: string;
  stock: number;
  imagenUrl: string;
  destacado: boolean;
  activo: boolean;
  tiendaId: number;
}
