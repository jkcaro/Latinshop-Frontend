import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';

@Component({
  selector: 'app-editar-producto',
  imports: [FormsModule],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProducto {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productosService = inject(ProductosService);

  readonly productoId = Number(this.route.snapshot.paramMap.get('id'));

  nombre = signal('');
  marca = signal('');
  categoriaId = signal(0);
  paisOrigen = signal('');
  descripcion = signal('');
  precio = signal(0);
  precioOfertaVal: number | null = null;
  stock = signal(0);
  imagenUrl = signal('');
  destacado = signal(false);

  previewImagen = signal('');
  error = signal('');
  success = signal('');

  readonly categorias = computed(() => this.productosService.categorias());

  private cargado = false;

  constructor() {
    effect(() => {
      if (this.cargado) return;
      const producto = this.productosService.obtenerPorId(this.productoId);
      if (!producto) return;

      this.cargado = true;
      this.nombre.set(producto.nombre);
      this.marca.set(producto.marca);
      this.paisOrigen.set(producto.paisOrigen);
      this.descripcion.set(producto.descripcion);
      this.precio.set(producto.precio);
      this.precioOfertaVal = producto.precioOferta ?? null;
      this.stock.set(producto.stock);
      this.imagenUrl.set(producto.imagenUrl);
      this.destacado.set(producto.destacado);
      this.previewImagen.set(producto.imagenUrl || '');

      // Buscar el ID de la categoría del producto por nombre
      const cat = this.productosService.categorias().find(c => c.nombre === producto.categoria);
      this.categoriaId.set(cat?.id ?? 0);
    });
  }

  guardarCambios(): void {
    this.error.set('');
    this.success.set('');

    const cat = this.categorias().find(c => c.id === this.categoriaId());

    if (!this.nombre().trim() || !cat || this.precio() <= 0 || this.stock() < 0) {
      this.error.set('Completa correctamente los campos obligatorios.');
      return;
    }

    this.productosService.actualizarProducto(this.productoId, {
      nombre:       this.nombre(),
      marca:        this.marca(),
      precio:       this.precio(),
      precioOferta: this.precioOfertaVal ?? null,
      categoriaId:  this.categoriaId(),
      categoria:    cat.nombre,
      paisOrigen:   this.paisOrigen(),
      descripcion:  this.descripcion(),
      stock:        this.stock(),
      imagenUrl:    this.imagenUrl(),
      destacado:    this.destacado(),
    }).subscribe({
      next: () => {
        this.success.set('Producto actualizado correctamente.');
        setTimeout(() => this.router.navigateByUrl('/tienda/productos'), 800);
      },
      error: (err) => {
        this.error.set(`Error al guardar: ${err?.error?.message ?? err?.message ?? 'Error del servidor'}`);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('Selecciona un archivo de imagen válido.'); return; }
    if (file.size > 2000000) { this.error.set('La imagen es demasiado pesada (máx 2MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagenUrl.set(result);
      this.previewImagen.set(result);
      this.error.set('');
    };
    reader.readAsDataURL(file);
  }
}
