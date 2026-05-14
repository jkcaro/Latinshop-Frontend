import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TiendasService } from '../../../core/services/tiendas';
import { ProductosService } from '../../../core/services/productos';
import { CarritoService } from '../../../core/services/carrito';
import { AuthService } from '../../../core/services/auth';
import { ResenasService } from '../../../core/services/resenas';
import { HorarioTienda } from '../../../core/models/tienda.model';
import { EstadisticasResenas } from '../../../core/models/resena.model';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-detalle-tienda',
  imports: [CurrencyPipe, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './detalle-tienda.html',
  styleUrl: './detalle-tienda.css'
})
export class DetalleTienda {
  private readonly route = inject(ActivatedRoute);
  private readonly tiendasService = inject(TiendasService);
  private readonly productosService = inject(ProductosService);
  private readonly carritoService = inject(CarritoService);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly resenasService = inject(ResenasService);

  readonly tiendaId = Number(this.route.snapshot.paramMap.get('id'));

  readonly tienda = computed(() => this.tiendasService.obtenerPorId(this.tiendaId));

  readonly mapaUrl = computed((): SafeResourceUrl | null => {
    const t = this.tienda();
    if (!t?.direccion) return null;
    const q = encodeURIComponent(`${t.direccion}, ${t.ciudad}`);
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${q}&output=embed`
    );
  });

  readonly productos = computed(() =>
    this.productosService.obtenerPorTienda(this.tiendaId).filter(p => p.activo)
  );

  readonly categorias = computed(() =>
    [...new Set(this.productos().map(p => p.categoria))].filter(Boolean)
  );

  private readonly categoriaEmojis: Record<string, string> = {
    'Harinas':     '🌽',
    'Bebidas':     '🥤',
    'Dulces':      '🍬',
    'Snacks':      '🍿',
    'Enlatados':   '🥫',
    'Congelados':  '❄️',
    'Alimentos':   '🛒',
    'Lácteos':     '🥛',
    'Carnes':      '🥩',
    'Verduras':    '🥦',
    'Frutas':      '🍎',
    'Condimentos': '🧂',
    'Panadería':   '🍞',
    'Limpieza':    '🧹',
    'Licores':     '🍶',
    'Cereales':    '🌾',
  };

  categoriaEmoji(cat: string): string {
    return this.categoriaEmojis[cat] ?? '🏷️';
  }

  readonly mapsLink = computed(() => {
    const t = this.tienda();
    if (!t) return '#';
    return `https://maps.google.com?q=${encodeURIComponent(`${t.direccion}, ${t.ciudad}`)}`;
  });

  horarios = signal<HorarioTienda[]>([]);
  modalHorarioAbierto = signal(false);

  abrirHorario(): void { this.modalHorarioAbierto.set(true); }
  cerrarHorario(): void { this.modalHorarioAbierto.set(false); }
  readonly diasNombres = DIAS;

  readonly diaHoy = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  formatHora(h: string | null): string {
    if (!h) return '';
    return h.substring(0, 5);
  }

  categoriaFiltro = signal<string | null>(null);

  readonly productosFiltrados = computed(() => {
    const filtro = this.categoriaFiltro();
    return filtro
      ? this.productos().filter(p => p.categoria === filtro)
      : this.productos();
  });

  filtrarCategoria(cat: string): void {
    this.categoriaFiltro.set(this.categoriaFiltro() === cat ? null : cat);
    this.paginaActual.set(1);
  }

  readonly productosPorPagina = 8;
  paginaActual = signal(1);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.productosPorPagina))
  );

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.productosPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.productosPorPagina);
  });

  paginaAnterior(): void { this.paginaActual.update(p => p - 1); }
  paginaSiguiente(): void { this.paginaActual.update(p => p + 1); }

  loginRequerido = signal<number | null>(null);

  // ── Reseñas ──
  readonly resenas = this.resenasService.resenas;
  statsResenas = signal<EstadisticasResenas | null>(null);
  private readonly _pedidoId = signal<number | null>(null);
  puedeResenar = signal(false);
  nuevaCalificacion = signal(0);
  nuevoComentario = signal('');
  resenaError = signal('');
  enviandoResena = signal(false);
  resenaExito = signal(false);
  modalResenaAbierto = signal(false);

  cerrarModalResena(): void {
    this.modalResenaAbierto.set(false);
    this.nuevaCalificacion.set(0);
    this.nuevoComentario.set('');
    this.resenaError.set('');
  }

  readonly estrellasPromedio = computed(() => {
    const prom = this.statsResenas()?.promedio ?? 0;
    return Array.from({ length: 5 }, (_, i) => {
      const val = i + 1;
      if (prom >= val) return 'full';
      if (prom >= val - 0.5) return 'half';
      return 'empty';
    }) as ('full' | 'half' | 'empty')[];
  });

  readonly labelCalificacion = computed(() => {
    const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    return labels[this.nuevaCalificacion()] ?? '';
  });

  estrellas(n: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < n ? '★' : '☆');
  }

  enviarResena(): void {
    const pedidoId = this._pedidoId();
    if (!pedidoId || this.nuevaCalificacion() === 0) return;
    this.enviandoResena.set(true);
    this.resenaError.set('');
    this.resenasService.crearResena({
      tienda_id: this.tiendaId,
      pedido_id: pedidoId,
      calificacion: this.nuevaCalificacion(),
      comentario: this.nuevoComentario() || undefined
    }).subscribe(res => {
      this.enviandoResena.set(false);
      if (res.ok) {
        this.modalResenaAbierto.set(false);
        this.resenaExito.set(true);
        this.puedeResenar.set(false);
        this.nuevaCalificacion.set(0);
        this.nuevoComentario.set('');
        this.resenasService.cargarPorTienda(this.tiendaId);
        this.resenasService.obtenerStats(this.tiendaId).subscribe(s => this.statsResenas.set(s));
        setTimeout(() => this.resenaExito.set(false), 4000);
      } else {
        this.resenaError.set(res.message);
      }
    });
  }

  constructor() {
    this.tiendasService.getHorarios(this.tiendaId).subscribe(rows => {
      this.horarios.set(rows.map(r => ({ ...r, cerrado: !!r.cerrado })));
    });
    this.resenasService.cargarPorTienda(this.tiendaId);
    this.resenasService.obtenerStats(this.tiendaId).subscribe(s => this.statsResenas.set(s));
    this.resenasService.puedeResenar(this.tiendaId).subscribe(r => {
      this.puedeResenar.set(r.puede);
      if (r.pedidoId) this._pedidoId.set(r.pedidoId);
    });
  }

  agregarAlCarrito(productoId: number): void {
    this.loginRequerido.set(null);

    if (!this.authService.isCliente()) {
      this.loginRequerido.set(productoId);
      setTimeout(() => this.loginRequerido.set(null), 4000);
      return;
    }

    const producto = this.productosService.obtenerPorId(productoId);
    if (!producto || !producto.activo) return;

    this.carritoService.agregarProducto(producto);
  }
}
