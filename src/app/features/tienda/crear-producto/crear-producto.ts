import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductosService } from '../../../core/services/productos';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-crear-producto',
  imports: [FormsModule],
  templateUrl: './crear-producto.html',
  styleUrl: './crear-producto.css',
})
export class CrearProducto {
  private readonly productosService = inject(ProductosService);
  private readonly authService = inject(AuthService);

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
  success = signal('');
  error = signal('');

  readonly categorias = computed(() => this.productosService.categorias());

  crearProducto(): void {
    this.error.set('');
    this.success.set('');

    const user = this.authService.currentUser();
    if (!user || user.rol !== 'TIENDA') {
      this.error.set('No autorizado.');
      return;
    }

    const cat = this.categorias().find(c => c.id === this.categoriaId());
    const faltantes: string[] = [];
    if (!this.nombre().trim()) faltantes.push('Nombre');
    if (!cat)                  faltantes.push('Categoría');
    if (this.precio() <= 0)    faltantes.push('Precio (debe ser mayor a 0)');
    if (this.stock() < 0)      faltantes.push('Stock (no puede ser negativo)');

    if (faltantes.length > 0) {
      this.error.set(`Campos obligatorios incompletos: ${faltantes.join(', ')}.`);
      return;
    }

    this.productosService.crearProducto({
      nombre:       this.nombre(),
      marca:        this.marca(),
      precio:       this.precio(),
      precioOferta: this.precioOfertaVal ?? null,
      categoriaId:  this.categoriaId(),
      categoria:    cat!.nombre,
      paisOrigen:   this.paisOrigen(),
      descripcion:  this.descripcion(),
      stock:        this.stock(),
      imagenUrl:    this.imagenUrl(),
      destacado:    this.destacado(),
      activo:       true,
      tiendaId:     user.tiendaId!,
    }).subscribe({
      next: () => {
        this.success.set('¡Producto guardado correctamente!');
        setTimeout(() => this.success.set(''), 3000);
        this.nombre.set('');
        this.marca.set('');
        this.categoriaId.set(0);
        this.paisOrigen.set('');
        this.descripcion.set('');
        this.precio.set(0);
        this.precioOfertaVal = null;
        this.stock.set(0);
        this.imagenUrl.set('');
        this.destacado.set(false);
        this.previewImagen.set('');
      },
      error: err => {
        this.error.set(`Error al guardar: ${err?.error?.message ?? 'Error del servidor'}`);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2000000) { this.error.set('La imagen es demasiado pesada (máx 2MB).'); return; }
    if (!file.type.startsWith('image/')) { this.error.set('Solo se permiten imágenes.'); return; }
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
