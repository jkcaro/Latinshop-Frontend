import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Mensaje } from '../models/mensaje.model';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private readonly http = inject(HttpClient);
  private readonly API = 'https://latinshop-backend-production.up.railway.app/api/mensajes';

  private mapMensaje(raw: any): Mensaje {
    return {
      id:            raw.id,
      pedidoId:      raw.pedido_id,
      remitenteTipo: raw.remitente_tipo,
      remitenteId:   raw.remitente_id,
      contenido:     raw.contenido,
      fechaEnvio:    raw.fecha_envio,
      leido:         Boolean(raw.leido)
    };
  }

  obtener(pedidoId: number): Observable<Mensaje[]> {
    return this.http.get<any[]>(`${this.API}/pedido/${pedidoId}`).pipe(
      map(rows => rows.map(r => this.mapMensaje(r))),
      catchError(() => of([]))
    );
  }

  enviar(pedidoId: number, contenido: string): Observable<Mensaje | null> {
    return this.http.post<any>(`${this.API}/pedido/${pedidoId}`, { contenido }).pipe(
      map(raw => this.mapMensaje(raw)),
      catchError(() => of(null))
    );
  }

  marcarLeidos(pedidoId: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/pedido/${pedidoId}/leer`, {}).pipe(
      catchError(() => of(undefined as void))
    );
  }
}
