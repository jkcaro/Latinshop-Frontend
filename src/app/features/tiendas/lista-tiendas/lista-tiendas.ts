import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TiendasService } from '../../../core/services/tiendas';
import { AuthService } from '../../../core/services/auth';
import { ResenasService } from '../../../core/services/resenas';

interface RatingInfo { promedio: number; total: number; }

@Component({
  selector: 'app-lista-tiendas',
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './lista-tiendas.html',
  styleUrl: './lista-tiendas.css'
})
export class ListaTiendas implements OnInit {
  private readonly tiendasService  = inject(TiendasService);
  private readonly authService     = inject(AuthService);
  private readonly resenasService  = inject(ResenasService);

  textoBusqueda = signal('');
  ciudadFiltro  = signal('');
  ordenFiltro   = signal('popular');
  paginaActual  = signal(1);
  readonly tiendaPorPagina = 6;

  private readonly _ratings    = signal<Map<number, RatingInfo>>(new Map());
  private readonly _favoritas  = signal<Set<number>>(new Set());
  private ratingsCargados = new Set<number>();

  private readonly tiendas = computed(() => {
    const user  = this.authService.currentUser();
    const todas = this.tiendasService.tiendasAprobadas();
    return (user?.rol === 'CLIENTE' && user.ciudadId)
      ? todas.filter(t => t.ciudadId === user.ciudadId)
      : todas;
  });

  readonly ciudades = computed(() =>
    [...new Set(this.tiendas().map(t => t.ciudad).filter(Boolean))].sort()
  );

  readonly tiendasFiltradas = computed(() => {
    let lista = this.tiendas();

    const texto = this.textoBusqueda().trim().toLowerCase();
    if (texto) lista = lista.filter(t => t.nombreNegocio.toLowerCase().includes(texto));

    const ciudad = this.ciudadFiltro();
    if (ciudad) lista = lista.filter(t => t.ciudad === ciudad);

    const orden = this.ordenFiltro();
    if (orden === 'az') lista = [...lista].sort((a, b) => a.nombreNegocio.localeCompare(b.nombreNegocio));
    else if (orden === 'za') lista = [...lista].sort((a, b) => b.nombreNegocio.localeCompare(a.nombreNegocio));
    else lista = [...lista].sort((a, b) => {
      const ra = this._ratings().get(a.id)?.promedio ?? 0;
      const rb = this._ratings().get(b.id)?.promedio ?? 0;
      return rb - ra;
    });

    return lista;
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.tiendasFiltradas().length / this.tiendaPorPagina))
  );

  readonly tiendasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.tiendaPorPagina;
    return this.tiendasFiltradas().slice(inicio, inicio + this.tiendaPorPagina);
  });

  ngOnInit(): void {
    this.cargarRatings();
  }

  private cargarRatings(): void {
    const ids = this.tiendas().map(t => t.id).filter(id => !this.ratingsCargados.has(id));
    for (const id of ids) {
      this.ratingsCargados.add(id);
      this.resenasService.obtenerStats(id).subscribe(stats => {
        this._ratings.update(m => { const n = new Map(m); n.set(id, { promedio: stats.promedio, total: stats.total }); return n; });
      });
    }
  }

  getRating(tiendaId: number): RatingInfo | null {
    const r = this._ratings().get(tiendaId);
    return r && r.promedio > 0 ? r : null;
  }

  toggleFavorita(id: number): void {
    this._favoritas.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  esFavorita(id: number): boolean { return this._favoritas().has(id); }

  paginaAnterior(): void { this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { this.paginaActual.update(p => p + 1); }

  onFiltroChange(): void { this.paginaActual.set(1); }
}
