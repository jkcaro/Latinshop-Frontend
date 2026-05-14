import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResenasService } from '../../../core/services/resenas';
import { Resena } from '../../../core/models/resena.model';

@Component({
  selector: 'app-moderar-resenas',
  imports: [DatePipe],
  templateUrl: './moderar-resenas.html',
  styleUrl: './moderar-resenas.css'
})
export class ModerarResenas implements OnInit {
  private readonly resenasService = inject(ResenasService);

  readonly resenas = this.resenasService.resenas;
  filtro = signal<'TODAS' | 'VISIBLE' | 'OCULTA'>('TODAS');
  procesando = signal<number | null>(null);
  mensaje = signal('');

  readonly resenasFiltradas = computed(() => {
    const f = this.filtro();
    if (f === 'TODAS') return this.resenas();
    return this.resenas().filter(r => r.estado === f);
  });

  ngOnInit(): void {
    this.resenasService.cargarTodasAdmin();
  }

  estrellas(n: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < n ? '★' : '☆');
  }

  cambiarEstado(resena: Resena): void {
    const nuevoEstado = resena.estado === 'VISIBLE' ? 'OCULTA' : 'VISIBLE';
    this.procesando.set(resena.id);
    this.resenasService.cambiarEstado(resena.id, nuevoEstado).subscribe(r => {
      this.procesando.set(null);
      this.mensaje.set(r.ok ? `Reseña ${nuevoEstado === 'VISIBLE' ? 'visible' : 'oculta'}.` : 'Error al actualizar.');
      setTimeout(() => this.mensaje.set(''), 2500);
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    this.procesando.set(id);
    this.resenasService.eliminarResena(id).subscribe(() => {
      this.procesando.set(null);
      this.resenasService.cargarTodasAdmin();
    });
  }
}
