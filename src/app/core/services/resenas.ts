import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Resena, EstadisticasResenas } from '../models/resena.model';

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private readonly http = inject(HttpClient);
  private readonly API = 'https://latinshop-backend-production.up.railway.app/api/resenas';

  private readonly _resenas = signal<Resena[]>([]);
  readonly resenas = this._resenas.asReadonly();

  private mapResena(raw: any): Resena {
    return {
      id: raw.id,
      tiendaId: raw.tienda_id,
      clienteId: raw.cliente_id,
      clienteNombre: raw.cliente_nombre ?? 'Cliente',
      pedidoId: raw.pedido_id,
      calificacion: raw.calificacion as 1 | 2 | 3 | 4 | 5,
      comentario: raw.comentario ?? null,
      fecha: raw.fecha ?? new Date().toISOString(),
      estado: raw.estado ?? 'VISIBLE',
      tiendasNombre: raw.tienda_nombre ?? ''
    };
  }

  cargarPorTienda(tiendaId: number): void {
    this.http.get<any[]>(`${this.API}/tienda/${tiendaId}`).subscribe({
      next: data => this._resenas.set(data.map(r => this.mapResena(r))),
      error: () => this._resenas.set([])
    });
  }

  obtenerStats(tiendaId: number): Observable<EstadisticasResenas> {
    return this.http.get<any>(`${this.API}/tienda/${tiendaId}/stats`).pipe(
      map(r => ({
        total: Number(r.total ?? 0),
        promedio: Number(r.promedio ?? 0),
        estrellas5: Number(r.estrellas5 ?? 0),
        estrellas4: Number(r.estrellas4 ?? 0),
        estrellas3: Number(r.estrellas3 ?? 0),
        estrellas2: Number(r.estrellas2 ?? 0),
        estrellas1: Number(r.estrellas1 ?? 0)
      })),
      catchError(() => of({ total: 0, promedio: 0, estrellas5: 0, estrellas4: 0, estrellas3: 0, estrellas2: 0, estrellas1: 0 }))
    );
  }

  puedeResenar(tiendaId: number): Observable<{ puede: boolean; pedidoId: number | null }> {
    return this.http.get<any>(`${this.API}/puede/${tiendaId}`).pipe(
      catchError(() => of({ puede: false, pedidoId: null }))
    );
  }

  crearResena(data: {
    tienda_id: number;
    pedido_id: number;
    calificacion: number;
    comentario?: string;
  }): Observable<{ ok: boolean; message: string }> {
    return this.http.post<any>(this.API, data).pipe(
      map(() => ({ ok: true, message: 'Reseña publicada correctamente.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al publicar la reseña.' }))
    );
  }

  eliminarResena(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<any>(`${this.API}/${id}`).pipe(
      map(() => ({ ok: true, message: 'Reseña eliminada.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al eliminar.' }))
    );
  }

  cargarMisResenas(): void {
    this.http.get<any[]>(`${this.API}/mis-resenas`).subscribe({
      next: data => this._resenas.set(data.map(r => this.mapResena(r))),
      error: () => this._resenas.set([])
    });
  }

  cargarTodasAdmin(): void {
    this.http.get<any[]>(`${this.API}/admin/todas`).subscribe({
      next: data => this._resenas.set(data.map(r => this.mapResena(r))),
      error: () => this._resenas.set([])
    });
  }

  cambiarEstado(id: number, estado: 'VISIBLE' | 'OCULTA'): Observable<{ ok: boolean }> {
    return this.http.put<any>(`${this.API}/${id}/estado`, { estado }).pipe(
      map(() => {
        const actualizadas = this._resenas().map(r => r.id === id ? { ...r, estado } : r);
        this._resenas.set(actualizadas);
        return { ok: true };
      }),
      catchError(() => of({ ok: false }))
    );
  }
}
