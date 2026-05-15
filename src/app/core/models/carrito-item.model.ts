// ============================================================
// MODELO: CarritoItem
// Representa un producto añadido al carrito de compras.
// El subtotal se calcula como precio × cantidad y se persiste
// junto al carrito en localStorage vía CarritoService.
// ============================================================

import { Producto } from './producto.model';

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
