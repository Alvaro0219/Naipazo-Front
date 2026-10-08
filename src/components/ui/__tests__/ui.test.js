// Componentes base de la guía "Noche porteña" (ESTILOS_NAIPAZO.md, secciones 4 y 5).
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { amountToneClass } from '../../../utils/format.js';
import Avatar, { PALOS, paloDe } from '../Avatar.vue';
import NzSegmentado from '../NzSegmentado.vue';
import SolDeMayo from '../SolDeMayo.vue';

describe('Avatar', () => {
  it('el palo sale del nombre: siempre el mismo, sin importar mayúsculas, y siempre uno de los cuatro', () => {
    for (const nombre of ['juan', 'pepe.22', 'maria_r', 'X', '']) {
      expect(PALOS).toContain(paloDe(nombre));
      expect(paloDe(nombre)).toBe(paloDe(nombre.toUpperCase()));
    }
    // Nombres parecidos tienden a tener palos distintos (no es una regla, pero en este muestreo se reparten)
    const palos = new Set(['juan', 'juana', 'juan1', 'juan2', 'juanc', 'juanp'].map(paloDe));
    expect(palos.size).toBeGreaterThan(1);
  });

  it('muestra la inicial en mayúscula y no se anuncia (es decorativo)', () => {
    const w = mount(Avatar, { props: { nombre: 'pepe' } });
    expect(w.text()).toContain('P');
    expect(w.attributes('aria-hidden')).toBe('true');
  });
});

describe('Sol de Mayo', () => {
  const contar = (w) => ({
    rectos: w.findAll('line').length,
    ondulados: w.findAll('path').length,
    circulos: w.findAll('circle').length
  });

  it('completo: disco, anillo interior, 8 rayos rectos y 8 ondulados', () => {
    expect(contar(mount(SolDeMayo, { props: { size: 120 } }))).toEqual({ rectos: 8, ondulados: 8, circulos: 2 });
  });

  it('versión chica (menos de 60 px): sin anillo interior y solo los 8 rayos rectos, con trazo de al menos 1 px real', () => {
    const w = mount(SolDeMayo, { props: { size: 34 } });
    expect(contar(w)).toEqual({ rectos: 8, ondulados: 0, circulos: 1 });
    // viewBox de 148 unidades en 34 px: 1 px real son unas 4,35 unidades
    const trazo = Number(w.find('line').attributes('stroke-width'));
    expect(trazo).toBeCloseTo(148 / 34, 5);
  });

  it('el primer rayo recto es horizontal y el dibujo es simétrico al girarlo 180°', () => {
    const w = mount(SolDeMayo, { props: { size: 120 } });
    const angulos = w.findAll('g[transform]').map((g) => Number(/rotate\(([-\d.]+)\)/.exec(g.attributes('transform'))[1]));
    expect(angulos[0]).toBe(0);
    for (const a of angulos) expect(angulos).toContain((a + 180) % 360);
  });

  it('con label se anuncia como imagen; sin label es decorativo', () => {
    expect(mount(SolDeMayo, { props: { label: 'Buenas' } }).attributes('role')).toBe('img');
    expect(mount(SolDeMayo).attributes('aria-hidden')).toBe('true');
  });
});

describe('Selector segmentado', () => {
  const opciones = [{ label: 'Todas', value: 'all' }, { label: 'Mesas', value: 'room' }, { label: 'Torneos', value: 'tournament', disable: true }];

  it('es un grupo de radios: marca la opción activa y emite la elegida', async () => {
    const w = mount(NzSegmentado, { props: { modelValue: 'all', opciones, ariaLabel: 'Tipo' } });
    expect(w.attributes('role')).toBe('radiogroup');
    const radios = w.findAll('[role="radio"]');
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual(['true', 'false', 'false']);
    await radios[1].trigger('click');
    expect(w.emitted('update:modelValue')).toEqual([['room']]);
  });

  it('las flechas recorren las opciones habilitadas', async () => {
    const w = mount(NzSegmentado, { props: { modelValue: 'room', opciones } });
    await w.trigger('keydown', { key: 'ArrowRight' });
    // La siguiente está deshabilitada: vuelve a la primera
    expect(w.emitted('update:modelValue')).toEqual([['all']]);
  });
});

describe('Color de los montos (10.6)', () => {
  it('premio en oro, devolución en verde, crédito en blanco y lo que sale en suave (nunca rojo)', () => {
    expect(amountToneClass(400, 'BET_PAYOUT')).toBe('nz-monto--oro');
    expect(amountToneClass(4000, 'TOURNAMENT_PRIZE')).toBe('nz-monto--oro');
    expect(amountToneClass(500, 'BET_REFUND')).toBe('nz-monto--verde');
    expect(amountToneClass(1000, 'DAILY_GRANT')).toBe('nz-monto--texto');
    expect(amountToneClass(-100, 'BET_LOCK')).toBe('nz-monto--suave');
    expect(amountToneClass(-500)).toBe('nz-monto--suave');
    expect(amountToneClass(200)).toBe('nz-monto--oro');
  });
});
