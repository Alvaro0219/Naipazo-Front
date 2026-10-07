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
  /* Borde propio de carta: blanco, filete fino y un margen para que el dibujo no toque el canto */
  padding: 4%;
  overflow: hidden;
  border-radius: 8% / 5.5%;
  border: 1px solid #c9c2a6;
  background: #fff;
  box-shadow: 0 3px 8px rgba(2, 6, 23, 0.25);
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

/* Alto = interior (ancho − margen − filete) con la proporción del dibujo (208 × 319) + margen y filete */
.tr-card--sm { width: 44px; height: 65px; }
.tr-card--md { width: 60px; height: 88px; }
.tr-card--lg { width: 78px; height: 115px; }

.tr-card--back {
  padding: 0;
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

/* La imagen va entera; solo se le recorta su contorno negro de 1 px (esquinas de 12 px sobre 208 × 319) */
.tr-card__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
  clip-path: inset(0.7% round 5.8% / 3.8%);
  pointer-events: none;
  user-select: none;
}
</style>
