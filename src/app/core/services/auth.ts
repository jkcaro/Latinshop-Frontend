import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API = 'https://latinshop-backend-production.up.railway.app/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private readonly _currentUser = signal<AuthUser | null>(this.loadStoredUser());
  private readonly _usuarios = signal<any[]>([]);

  readonly currentUser = this._currentUser.asReadonly();
  readonly clientes = computed(() => this._usuarios().filter(u => u.rol === 'CLIENTE'));

  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly role = computed<UserRole>(() => this._currentUser()?.rol ?? 'PUBLICO');
  readonly isPublico = computed(() => this.role() === 'PUBLICO');
  readonly isCliente = computed(() => this.role() === 'CLIENTE');
  readonly isTienda = computed(() => this.role() === 'TIENDA');
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private loadStoredUser(): AuthUser | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  }

  private setSession(user: AuthUser, token: string): void {
    this._currentUser.set(user);
    if (!this.isBrowser()) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  login(email: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ token: string; user: any }>(`${this.API}/auth/login`, { email, password }).pipe(
      tap(resp => {
        const user: AuthUser = {
          id: resp.user.id,
          nombre: resp.user.nombre,
          apellidos: resp.user.apellidos ?? '',
          email: resp.user.email,
          rol: resp.user.rol as UserRole,
          estado: 'APROBADA',
          telefono: resp.user.telefono ?? '',
          fotoPerfil: resp.user.fotoPerfil ?? '',
          clienteId: resp.user.clienteId ?? undefined,
          tiendaId: resp.user.tiendaId ?? undefined,
          ciudadId: resp.user.ciudadId ?? null,
          direccion: resp.user.direccion ?? ''
        };
        this.setSession(user, resp.token);
      }),
      map(() => ({ ok: true, message: 'Acceso correcto.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Credenciales incorrectas.' }))
    );
  }

  loginCliente(email: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.login(email, password);
  }

  loginAsTienda(email: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.login(email, password);
  }

  loginAsAdmin(email: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.login(email, password);
  }

  registrarCliente(data: {
    nombre: string; apellidos?: string; email: string; password: string;
    telefono?: string; ciudad_id?: number | null; direccion?: string;
    acepta_privacidad: boolean;
  }): Observable<{ ok: boolean; message: string }> {
    return this.http.post(`${this.API}/auth/registro`, data).pipe(
      map(() => ({ ok: true, message: 'Registro exitoso.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al registrar.' }))
    );
  }

  actualizarPerfilCliente(data: {
    nombre: string; apellidos: string; email: string; telefono: string;
    password: string; fotoPerfil: string; ciudadId?: number | null; direccion?: string;
  }): Observable<{ ok: boolean; message: string }> {
    return this.http.put(`${this.API}/auth/perfil`, data).pipe(
      tap(() => {
        const actual = this._currentUser();
        if (actual) {
          const updated: AuthUser = { ...actual, nombre: data.nombre, apellidos: data.apellidos, email: data.email, telefono: data.telefono, fotoPerfil: data.fotoPerfil, ciudadId: data.ciudadId ?? actual.ciudadId, direccion: data.direccion ?? actual.direccion };
          this._currentUser.set(updated);
          if (this.isBrowser()) localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        }
      }),
      map(() => ({ ok: true, message: 'Perfil actualizado correctamente.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? err.message ?? 'Error al actualizar. Intenta con una imagen más pequeña.' }))
    );
  }

  cargarUsuarios(): void {
    this.http.get<any[]>(`${this.API}/admin/usuarios`).subscribe({
      next: usuarios => {
        const mapped = usuarios.map(u => ({
          ...u,
          estado: u.activo ? 'APROBADA' : 'BLOQUEADA'
        }));
        this._usuarios.set(mapped);
      },
      error: err => console.error('Error cargando usuarios:', err)
    });
  }

  cambiarEstadoCliente(id: number): void {
    this.http.put(`${this.API}/admin/usuarios/${id}/estado`, {}).subscribe({
      next: () => {
        const actualizados = this._usuarios().map(u =>
          u.id === id
            ? { ...u, activo: !u.activo, estado: u.activo ? 'BLOQUEADA' : 'APROBADA' }
            : u
        );
        this._usuarios.set(actualizados);
      },
      error: err => console.error('Error cambiando estado:', err)
    });
  }

  obtenerClientes(): any[] {
    return this._usuarios().filter(u => u.rol === 'CLIENTE');
  }

  obtenerUsuariosAdmin(): AuthUser[] {
    return this._usuarios() as AuthUser[];
  }

  buscarCuentaPorEmail(email: string): { existe: boolean; tipo: 'CLIENTE' | 'TIENDA' | null } {
    const u = this._usuarios().find(u => u.email === email);
    if (u) return { existe: true, tipo: u.rol === 'TIENDA' ? 'TIENDA' : 'CLIENTE' };
    return { existe: false, tipo: null };
  }

  actualizarPasswordCliente(_email: string, _nuevaPassword: string): boolean { return false; }
  actualizarPasswordTienda(_email: string, _nuevaPassword: string): boolean { return false; }

  solicitarReset(email: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post(`${this.API}/auth/solicitar-reset`, { email }).pipe(
      map((r: any) => ({ ok: true, message: r.message ?? 'Enlace enviado.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'Error al procesar la solicitud.' }))
    );
  }

  resetPassword(token: string, password: string): Observable<{ ok: boolean; message: string }> {
    return this.http.post(`${this.API}/auth/reset-password`, { token, password }).pipe(
      map((r: any) => ({ ok: true, message: r.message ?? 'Contraseña actualizada.' })),
      catchError(err => of({ ok: false, message: err.error?.message ?? 'El enlace no es válido o ha caducado.' }))
    );
  }

  logout(): void {
    this._currentUser.set(null);
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
