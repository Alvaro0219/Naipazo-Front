import { Dialog } from 'quasar';
import NzConfirmar from '../components/ui/NzConfirmar.vue';

/**
 * Confirmación con la hoja inferior de Naipazo (components/ui/NzConfirmar.vue). Recibe las mismas opciones que se
 * le pasaban a $q.dialog ({ title, message, cancel: { label }, ok: { label, color } }) y devuelve lo mismo
 * (se encadena con .onOk()). Un `ok.color` 'negative' marca la acción como destructiva.
 */
export function confirmar({ title, message = '', cancel, ok }) {
  return Dialog.create({
    component: NzConfirmar,
    componentProps: {
      titulo: title,
      mensaje: message,
      aceptar: ok?.label || 'Aceptar',
      cancelar: cancel?.label || 'Cancelar',
      destructiva: ok?.color === 'negative'
    }
  });
}
