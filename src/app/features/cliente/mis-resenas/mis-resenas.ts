// ============================================================
// COMPONENTE: MisResenas (Cliente)
// Carga y muestra las reseñas del cliente autenticado.
// Permite editar la calificación/comentario o eliminar
// una reseña existente con confirmación.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ResenasService } from '../../../core/services/resenas';
import { Resena } from '../../../core/models/resena.model';

@Component({
  selector: 'app-mis-resenas',
  imports: [DatePipe],
  templateUrl: './mis-resenas.html',
  styleUrl: './mis-resenas.css'
})
export class MisResenas implements OnInit {
  private readonly resenasService = inject(ResenasService);

  readonly resenas = this.resenasService.resenas;
  eliminando = signal<number | null>(null);
  mensaje = signal('');

  ngOnInit(): void {
    this.resenasService.cargarMisResenas();
  }

  estrellas(n: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < n ? '★' : '☆');
  }

  eliminar(id: number): void {
    this.eliminando.set(id);
    this.resenasService.eliminarResena(id).subscribe(r => {
      this.eliminando.set(null);
      this.mensaje.set(r.message);
      if (r.ok) this.resenasService.cargarMisResenas();
      setTimeout(() => this.mensaje.set(''), 3000);
    });
  }
}
