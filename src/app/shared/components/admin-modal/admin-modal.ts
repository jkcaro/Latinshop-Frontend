// ============================================================
// COMPONENTE: AdminModal
// Modal genérico del panel admin. Acepta título, descripción,
// textos de botones y el flag `danger` para el color de confirmación.
// Expone los outputs `close` y `confirm` para que el padre reaccione.
// ============================================================

import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-modal',
  templateUrl: './admin-modal.html',
  styleUrl: './admin-modal.css',
})
export class AdminModal {
  title = input<string>('');
  description = input<string>('');
  confirmText = input<string>('Confirmar');
  cancelText = input<string>('Cancelar');
  danger = input<boolean>(false);
  showConfirm = input<boolean>(true);
  showCancel = input<boolean>(true);

  close = output<void>();
  confirm = output<void>();
}
