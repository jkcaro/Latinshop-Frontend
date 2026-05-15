// ============================================================
// COMPONENTE: MensajesPedido
// Widget de mensajería para la conversación entre cliente y
// tienda dentro de un pedido. Hace scroll automático al último
// mensaje y delega el envío en MensajesService.
// ============================================================

import {
  Component, Input, OnInit, inject, signal, ElementRef, ViewChild, AfterViewChecked
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajesService } from '../../../core/services/mensajes';
import { Mensaje } from '../../../core/models/mensaje.model';

@Component({
  selector: 'app-mensajes-pedido',
  imports: [DatePipe, FormsModule],
  templateUrl: './mensajes-pedido.html',
  styleUrl: './mensajes-pedido.css'
})
export class MensajesPedido implements OnInit, AfterViewChecked {
  @Input({ required: true }) pedidoId!: number;
  @Input({ required: true }) miTipo!: 'CLIENTE' | 'TIENDA';

  @ViewChild('listaMensajes') private listaRef!: ElementRef<HTMLElement>;

  private readonly mensajesService = inject(MensajesService);

  readonly mensajes   = signal<Mensaje[]>([]);
  readonly enviando   = signal(false);
  readonly error      = signal('');
  texto = '';

  private debeScroll = false;

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewChecked(): void {
    if (this.debeScroll) {
      this.scrollAlFinal();
      this.debeScroll = false;
    }
  }

  cargar(): void {
    this.mensajesService.obtener(this.pedidoId).subscribe(lista => {
      this.mensajes.set(lista);
      this.debeScroll = true;
      this.mensajesService.marcarLeidos(this.pedidoId).subscribe();
    });
  }

  enviar(): void {
    const contenido = this.texto.trim();
    if (!contenido || this.enviando()) return;

    this.enviando.set(true);
    this.error.set('');

    this.mensajesService.enviar(this.pedidoId, contenido).subscribe(nuevo => {
      this.enviando.set(false);
      if (nuevo) {
        this.mensajes.update(lista => [...lista, nuevo]);
        this.texto = '';
        this.debeScroll = true;
      } else {
        this.error.set('No se pudo enviar el mensaje. Intenta de nuevo.');
      }
    });
  }

  esMio(m: Mensaje): boolean {
    return m.remitenteTipo === this.miTipo;
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  private scrollAlFinal(): void {
    const el = this.listaRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
