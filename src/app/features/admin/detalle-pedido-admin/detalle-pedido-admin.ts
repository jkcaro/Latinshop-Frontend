// ============================================================
// COMPONENTE: DetallePedidoAdmin
// Carga un pedido por ID de ruta y muestra su información
// completa con datos de cliente, tienda y desglose de items.
// Solo accesible desde el panel de administración.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidosService } from '../../../core/services/pedidos';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-detalle-pedido-admin',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './detalle-pedido-admin.html',
  styleUrl: './detalle-pedido-admin.css'
})
export class DetallePedidoAdmin {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidosService = inject(PedidosService);
  private readonly tiendasService = inject(TiendasService);

  readonly pedidoId = Number(this.route.snapshot.paramMap.get('id'));

  readonly pedido = computed(() =>
    this.pedidosService.obtenerPorId(this.pedidoId) ?? null
  );

  readonly tienda = computed(() => {
    const pedido = this.pedido();
    if (!pedido) return null;

    return this.tiendasService.obtenerPorId(pedido.tiendaId) ?? null;
  });
}
