// ============================================================
// COMPONENTE: DetalleProductoAdmin
// Vista de solo lectura de un producto accedida desde el panel
// admin. Carga el producto por ID de ruta y enriquece los datos
// con el nombre de la tienda propietaria.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-detalle-producto-admin',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './detalle-producto-admin.html',
  styleUrl: './detalle-producto-admin.css'
})
export class DetalleProductoAdmin {
  private readonly route = inject(ActivatedRoute);
  private readonly productosService = inject(ProductosService);
  private readonly tiendasService = inject(TiendasService);

  readonly productoId = Number(this.route.snapshot.paramMap.get('id'));

  readonly producto = computed(() =>
    this.productosService.obtenerPorId(this.productoId) ?? null
  );

  readonly tienda = computed(() => {
    const producto = this.producto();
    if (!producto) return null;

    return this.tiendasService.obtenerPorId(producto.tiendaId) ?? null;
  });
}
