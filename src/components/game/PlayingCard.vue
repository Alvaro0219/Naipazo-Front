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
  border-radius: 9px;
  border: 1px solid #d6cfae;
  background: #fff;
  box-shadow: 0 3px 8px rgba(2, 6, 23, 0.25);
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

/* Proporción de las imágenes de la baraja: 208 × 319 */
.tr-card--sm { width: 44px; height: 67px; }
.tr-card--md { width: 60px; height: 92px; }
.tr-card--lg { width: 78px; height: 120px; }

.tr-card--back {
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

/* La imagen trae su propio marco redondeado: se agranda un poco para que el borde lo ponga la carta */
.tr-card__img {
  flex-shrink: 0;
  width: 108%;
  height: 106%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}
</style>
