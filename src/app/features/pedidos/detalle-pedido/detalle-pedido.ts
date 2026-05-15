// ============================================================
// COMPONENTE: DetallePedido (Cliente)
// Carga el pedido por ID de ruta y muestra su estado completo
// con stepper visual. Incluye formulario de reseña disponible
// solo cuando el pedido está en estado ENTREGADO.
// ============================================================

import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidosService } from '../../../core/services/pedidos';
import { EstadoPedido, MetodoPago, MetodoEnvio } from '../../../core/models/pedido.model';
import { MensajesPedido } from '../../../shared/components/mensajes-pedido/mensajes-pedido';

@Component({
  selector: 'app-detalle-pedido',
  imports: [CurrencyPipe, DatePipe, RouterLink, MensajesPedido],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css'
})
export class DetallePedido {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidosService = inject(PedidosService);

  readonly pedidoId = Number(this.route.snapshot.paramMap.get('id'));
  readonly pedido = computed(() => this.pedidosService.obtenerPorId(this.pedidoId) ?? null);

  readonly PASOS_STEPPER = [
    { estado: 'PENDIENTE',       label: 'Confirmado'      },
    { estado: 'EN_PREPARACION',  label: 'En preparación'  },
    { estado: 'ENVIADO',         label: 'Enviado'         },
    { estado: 'ENTREGADO',       label: 'Entregado'       },
  ];

  private readonly ORDEN_ESTADOS = ['PENDIENTE', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO'];

  constructor() {
    this.pedidosService.cargarPedidoCompleto(this.pedidoId);
  }

  pasoCompletado(pasoEstado: string): boolean {
    const p = this.pedido();
    if (!p || p.estado === 'CANCELADO') return false;
    return this.ORDEN_ESTADOS.indexOf(p.estado) >= this.ORDEN_ESTADOS.indexOf(pasoEstado);
  }

  fechaPaso(pasoEstado: string): string | null {
    return this.pedido()?.historial?.find(h => h.estado === pasoEstado)?.fecha ?? null;
  }

  estadoLabel(estado: EstadoPedido): string {
    const m: Record<EstadoPedido, string> = {
      PENDIENTE:       'Pendiente',
      EN_PREPARACION:  'En preparación',
      ENVIADO:         'Enviado',
      ENTREGADO:       'Entregado',
      CANCELADO:       'Cancelado',
    };
    return m[estado] ?? estado;
  }

  metodoPagoLabel(m: MetodoPago): string {
    const labels: Record<MetodoPago, string> = {
      TARJETA:        'Tarjeta',
      PAYPAL:         'PayPal',
      BIZUM:          'Bizum',
      TRANSFERENCIA:  'Transferencia',
      CONTRA_ENTREGA: 'Contra entrega',
    };
    return labels[m] ?? m;
  }

  metodoEnvioLabel(m: MetodoEnvio): string {
    const labels: Record<MetodoEnvio, string> = {
      ESTANDAR:        'Estándar',
      EXPRESS:         'Express',
      RECOGIDA_TIENDA: 'Recogida en tienda',
    };
    return labels[m] ?? m;
  }

  mapUrl(): string {
    const p = this.pedido();
    if (!p) return '#';
    const q = encodeURIComponent(`${p.direccionEnvio}, ${p.ciudadEnvio}, ${p.codigoPostalEnvio}, España`);
    return `https://maps.google.com/?q=${q}`;
  }
}
