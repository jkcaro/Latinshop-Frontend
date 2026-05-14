import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { HorarioTienda, Tienda } from '../models/tienda.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TiendasService {
  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  private readonly _tiendas = signal<Tienda[]>([]);

  readonly tiendas = this._tiendas.asReadonly();

  readonly tiendasPendientes = computed(() =>
    this._tiendas().filter(t => t.estado === 'PENDIENTE')
  );

  readonly tiendasAprobadas = computed(() =>
    this._tiendas().filter(t => t.estado === 'APROBADA')
  );

  constructor() {
    this.cargarTiendas();
  }

  private mapTienda(raw: any): Tienda {
    return {
      id: raw.id,
      nombrePropietario: raw.propietario_nombre ?? raw.nombre ?? '',
      apellidosPropietario: raw.propietario_apellidos ?? raw.apellidos ?? '',
      email: raw.email ?? '',
      password: '',
      nombreNegocio: raw.nombre_negocio ?? '',
      nifCif: raw.nif_cif ?? '',
      ciudad: raw.ciudad_nombre ?? raw.ciudad ?? '',
      ciudadId: raw.ciudad_id ?? undefined,
      direccion: raw.direccion ?? '',
      telefono: raw.telefono_contacto ?? raw.telefono ?? '',
      descripcion: raw.descripcion ?? '',
      aceptaPolitica: !!raw.acepta_politica,
      recibeOfertas: false,
      estado: (raw.estado_revision ?? 'PENDIENTE') as Tienda['estado'],
      activa: raw.estado_revision === 'APROBADA',
      imagenUrl: raw.imagen_url ?? '',
      motivoAdmin: '',
      notaInterna: '',
      radioEntrega: raw.radio_entrega_km ?? 0
    };
  }

  cargarTiendas(): void {
    this.http.get<any[]>(`${this.API}/tiendas`).subscribe({
      next: data => this._tiendas.set(data.map(t => this.mapTienda(t))),
      error: err => console.error('Error cargando tiendas:', err)
    });
  }

  cargarTodasParaAdmin(): void {
    this.http.get<any[]>(`${this.API}/tiendas/todas`).subscribe({
      next: data => this._tiendas.set(data.map(t => this.mapTienda(t))),
      error: err => console.error('Error cargando todas las tiendas:', err)
    });
  }

  getAll(): Observable<Tienda[]> {
    return of(this._tiendas());
  }

  obtenerTodasLasTiendas(): Tienda[] {
    return this._tiendas();
  }

  obtenerPorId(id: number): Tienda | undefined {
    return this._tiendas().find(t => t.id === id);
  }

  obtenerPorEmail(email: string): Tienda | undefined {
    return this._tiendas().find(t => t.email === email);
  }

  registrarTienda(data: Omit<Tienda, 'id' | 'estado' | 'activa'>): Observable<{ ok: boolean; message: string }> {
    const body = {
      nombre: data.nombrePropietario,
      apellidos: data.apellidosPropietario,
      email: data.email,
      password: data.password,
      telefono: data.telefono,
      nombre_negocio: data.nombreNegocio,
      nif_cif: data.nifCif,
      direccion: data.direccion,
      ciudad_id: data.ciudadId ?? 1,
      codigo_postal: '',
      descripcion: data.descripcion,
      acepta_politica: data.aceptaPolitica
    };

    return this.http.post(`${this.API}/tiendas/registro`, body).pipe(
      map(() => ({ ok: true, message: 'Solicitud enviada. Tu tienda queda pendiente de aprobación.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al registrar la tienda.' }))
    );
  }

  aprobarTienda(id: number): void {
    this.http.put(`${this.API}/tiendas/${id}/aprobar`, {}).subscribe({
      next: () => this.actualizarEstadoLocal(id, 'APROBADA'),
      error: err => console.error('Error aprobando tienda:', err)
    });
  }

  rechazarTienda(id: number, motivo: string): void {
    this.http.put(`${this.API}/tiendas/${id}/rechazar`, { motivo }).subscribe({
      next: () => this.actualizarEstadoLocal(id, 'RECHAZADA'),
      error: err => console.error('Error rechazando tienda:', err)
    });
  }

  bloquearTienda(id: number, motivo: string): void {
    this.http.put(`${this.API}/tiendas/${id}/bloquear`, { motivo }).subscribe({
      next: () => this.actualizarEstadoLocal(id, 'BLOQUEADA'),
      error: err => console.error('Error bloqueando tienda:', err)
    });
  }

  desbloquearTienda(id: number): void {
    this.http.put(`${this.API}/tiendas/${id}/desbloquear`, {}).subscribe({
      next: () => this.actualizarEstadoLocal(id, 'APROBADA'),
      error: err => console.error('Error desbloqueando tienda:', err)
    });
  }

  marcarTiendaPendiente(id: number): void {
    this.actualizarEstadoLocal(id, 'PENDIENTE');
  }

  cambiarEstadoActivoTienda(id: number): void {
    const tienda = this._tiendas().find(t => t.id === id);
    if (!tienda) return;
    const nuevoEstado = tienda.estado === 'BLOQUEADA' ? 'APROBADA' : 'BLOQUEADA';
    if (nuevoEstado === 'BLOQUEADA') {
      this.bloquearTienda(id, '');
    } else {
      this.desbloquearTienda(id);
    }
  }

  getCiudades(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${this.API}/ciudades`);
  }

  actualizarPerfilTienda(id: number, cambios: Partial<Pick<Tienda,
    'nombreNegocio' | 'nombrePropietario' | 'apellidosPropietario' |
    'email' | 'telefono' | 'ciudad' | 'ciudadId' | 'direccion' | 'descripcion' | 'imagenUrl' | 'radioEntrega'>>
  ): Observable<{ ok: boolean; message: string }> {
    const body = {
      nombre_negocio: cambios.nombreNegocio,
      descripcion: cambios.descripcion,
      direccion: cambios.direccion,
      telefono_contacto: cambios.telefono,
      ciudad_id: cambios.ciudadId ?? 1,
      imagen_url: cambios.imagenUrl ?? '',
      radio_entrega_km: cambios.radioEntrega ?? 0
    };

    return this.http.put(`${this.API}/tiendas/${id}`, body).pipe(
      map(() => {
        const actualizadas = this._tiendas().map(t =>
          t.id === id ? { ...t, ...cambios } : t
        );
        this._tiendas.set(actualizadas);
        return { ok: true, message: 'Perfil de tienda actualizado correctamente.' };
      }),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al actualizar.' }))
    );
  }

  guardarNotaInterna(id: number, nota: string): void {
    const actualizadas = this._tiendas().map(t =>
      t.id === id ? { ...t, notaInterna: nota } : t
    );
    this._tiendas.set(actualizadas);
  }

  getHorarios(tiendaId: number): Observable<HorarioTienda[]> {
    return this.http.get<HorarioTienda[]>(`${this.API}/tiendas/${tiendaId}/horarios`).pipe(
      map(rows => rows.map(r => ({ ...r, cerrado: !!r.cerrado }))),
      catchError(() => of([]))
    );
  }

  guardarHorarios(tiendaId: number, horarios: HorarioTienda[]): Observable<{ ok: boolean; message: string }> {
    return this.http.put(`${this.API}/tiendas/${tiendaId}/horarios`, { horarios }).pipe(
      map(() => ({ ok: true, message: 'Horarios guardados correctamente.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al guardar horarios.' }))
    );
  }

  actualizarPasswordTienda(_email: string, _nuevaPassword: string): boolean { return false; }

  private actualizarEstadoLocal(id: number, estado: Tienda['estado']): void {
    const actualizadas = this._tiendas().map(t =>
      t.id === id ? { ...t, estado, activa: estado === 'APROBADA' } : t
    );
    this._tiendas.set(actualizadas);
  }
}
