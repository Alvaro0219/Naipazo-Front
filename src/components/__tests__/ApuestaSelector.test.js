// Apuesta o inscripción con chips rápidos y − / + (ESTILOS_NAIPAZO.md, 10.3): nunca supera el saldo ni el máximo.
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ApuestaSelector from '../ApuestaSelector.vue';

// Botón base falso: solo lo necesario para tocar − y +
const NzBoton = {
  props: ['label', 'disable'],
  emits: ['click'],
  template: '<button class="falso" :aria-label="label" :disabled="disable" @click="$emit(\'click\')" />'
};

const montar = (props) => mount(ApuestaSelector, { props, global: { stubs: { NzBoton } } });
const chips = (w) => w.findAll('.tr-apuesta__chip');
const boton = (w, texto) => w.findAll('button.falso').find((b) => b.attributes('aria-label').startsWith(texto));

describe('ApuestaSelector', () => {
  it('chips rápidos: Gratis, 500, 1.000, 2.500 y 5.000; los que superan el saldo, deshabilitados', () => {
    const w = montar({ modelValue: 0, saldo: 1200 });
    expect(chips(w).map((c) => c.text())).toEqual(['Gratis', '500', '1.000', '2.500', '5.000']);
    expect(chips(w).map((c) => c.attributes('disabled') !== undefined)).toEqual([false, false, false, true, true]);
  });

  it('los chips que superan el máximo del servidor no aparecen (salas con tope)', () => {
    const w = montar({ modelValue: 0, saldo: 9000, maximoServidor: 1000 });
    expect(chips(w).map((c) => c.text())).toEqual(['Gratis', '500', '1.000']);
  });

  it('tocar un chip lo elige y queda marcado', async () => {
    const w = montar({ modelValue: 500, saldo: 3000 });
    expect(chips(w)[1].attributes('aria-pressed')).toBe('true');
    await chips(w)[2].trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([[1000]]);
  });

  it('− y + de a 500 sin bajar de 0 ni pasar el saldo', async () => {
    const w = montar({ modelValue: 1000, saldo: 1300 });
    // Con 1.000 y saldo 1.300, subir 500 se pasaría: + deshabilitado
    expect(boton(w, 'Subir').attributes('disabled')).toBeDefined();
    await boton(w, 'Bajar').trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([[500]]);
    const cero = montar({ modelValue: 0, saldo: 1300 });
    expect(boton(cero, 'Bajar').attributes('disabled')).toBeDefined();
    await boton(cero, 'Subir').trigger('click');
    expect(cero.emitted('update:modelValue')).toEqual([[500]]);
  });

  it('muestra el saldo disponible', () => {
    expect(montar({ modelValue: 0, saldo: 2500 }).find('.tr-apuesta__saldo').text()).toBe('Saldo disponible: 2.500 fichas');
  });
});
