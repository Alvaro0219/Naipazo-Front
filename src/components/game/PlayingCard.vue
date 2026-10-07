<template>
  <component
    :is="clickable ? 'button' : 'div'"
    class="tr-card"
    :class="[`tr-card--${size}`, { 'tr-card--back': !cardId, 'tr-card--clickable': clickable, 'tr-card--dim': dim }]"
    :type="clickable ? 'button' : undefined"
    :role="clickable ? undefined : 'img'"
    :aria-label="cardId ? cardLabel(cardId) : 'Carta boca abajo'"
    @click="clickable && $emit('select', cardId)"
  >
    <!-- Baraja española de Germarquezm y Basquetteur (CC BY-SA 3.0, Wikimedia Commons): public/cartas/CREDITOS.md -->
    <img v-if="cardId" class="tr-card__img" :src="imageUrl"  alt="" draggable="false" />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { cardImageUrl, cardLabel } from '../../utils/cards.js';

const props = defineProps({
  cardId: { type: String, default: null }, // null = boca abajo
  size: { type: String, default: 'md' }, // sm | md | lg
  clickable: Boolean,
  dim: Boolean
});
defineEmits(['select']);

const imageUrl = computed(() => (props.cardId ? cardImageUrl(props.cardId) : null));
</script>

<style scoped>
.tr-card {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  /* Mismo redondeo que las esquinas del dibujo (12 px sobre 208 × 319) */
  border-radius: 5.8% / 3.8%;
  border: 0;
  background: #fff;
  box-shadow: 0 3px 8px rgba(2, 6, 23, 0.25);
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

/* Proporción del dibujo: 208 × 319 */
.tr-card--sm { width: 44px; height: 67px; }
.tr-card--md { width: 60px; height: 92px; }
.tr-card--lg { width: 78px; height: 120px; }

.tr-card--back {
  border-radius: 9px;
  border: 2px solid #ca8a04;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.08) 0 4px, transparent 4px 8px),
    #14532d;
}

.tr-card--clickable { cursor: pointer; }

.tr-card--clickable:hover,
.tr-card--clickable:focus-visible {
  transform: translateY(-8px);
  box-shadow: 0 10px 18px rgba(2, 6, 23, 0.35);
  outline: none;
}

.tr-card--clickable:focus-visible { box-shadow: 0 0 0 3px #fde047, 0 10px 18px rgba(2, 6, 23, 0.35); }

.tr-card--dim { opacity: 0.55; }

/* El dibujo ocupa toda la carta; se agranda apenas (1 %) para que su contorno de 1 px quede afuera */
.tr-card__img {
  display: block;
  width: 102%;
  height: 101.5%;
  flex-shrink: 0;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

/* Filete fino por encima del dibujo, siguiendo el canto: tapa las imperfecciones del borde de la imagen */
.tr-card:not(.tr-card--back)::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid rgba(60, 50, 30, 0.45);
  border-radius: inherit;
  pointer-events: none;
}
</style>
