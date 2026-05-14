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
