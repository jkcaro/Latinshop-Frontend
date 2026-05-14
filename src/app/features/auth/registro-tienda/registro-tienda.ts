import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TiendasService } from '../../../core/services/tiendas';

@Component({
  selector: 'app-registro-tienda',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro-tienda.html',
  styleUrl: './registro-tienda.css'
})
export class RegistroTienda implements OnInit {
  private readonly tiendasService = inject(TiendasService);
  private readonly router = inject(Router);

  nombrePropietario = signal('');
  apellidosPropietario = signal('');
  email = signal('');
  password = signal('');
  nombreNegocio = signal('');
  nifCif = signal('');
  ciudadId = signal<number>(0);
  ciudades = signal<{ id: number; nombre: string }[]>([]);
  direccion = signal('');
  telefono = signal('');
  descripcion = signal('');
  aceptaPolitica = signal(false);
  recibeOfertas = signal(false);
  error = signal('');
  success = signal('');
  loading = signal(false);

  ngOnInit(): void {
    this.tiendasService.getCiudades().subscribe(c => this.ciudades.set(c));
  }

  registrar(): void {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    if (
      !this.nombrePropietario() || !this.email() || !this.password() ||
      !this.nombreNegocio() || !this.nifCif() || !this.ciudadId() ||
      !this.direccion() || !this.telefono()
    ) {
      this.error.set('Completa todos los campos obligatorios.');
      this.loading.set(false);
      return;
    }

    if (!this.aceptaPolitica()) {
      this.error.set('Debes aceptar la política de privacidad.');
      this.loading.set(false);
      return;
    }

    this.tiendasService.registrarTienda({
      nombrePropietario: this.nombrePropietario(),
      apellidosPropietario: this.apellidosPropietario(),
      email: this.email(),
      password: this.password(),
      nombreNegocio: this.nombreNegocio(),
      nifCif: this.nifCif(),
      ciudad: this.ciudades().find(c => c.id === this.ciudadId())?.nombre ?? '',
      ciudadId: this.ciudadId(),
      direccion: this.direccion(),
      telefono: this.telefono(),
      descripcion: this.descripcion(),
      aceptaPolitica: this.aceptaPolitica(),
      recibeOfertas: this.recibeOfertas(),
      motivoAdmin: '',
      notaInterna: ''
    }).subscribe(result => {
      this.loading.set(false);

      if (!result.ok) {
        this.error.set(result.message);
        return;
      }

      this.success.set(result.message);
      setTimeout(() => this.router.navigateByUrl('/'), 1500);
    });
  }
}
