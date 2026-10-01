<template>
  <component
    :is="clickable ? 'button' : 'div'"
    class="tr-card"
    :class="[`tr-card--${size}`, { 'tr-card--back': !cardId, 'tr-card--clickable': clickable, 'tr-card--dim': dim }]"
    :type="clickable ? 'button' : undefined"
    :aria-label="cardId ? cardLabel(cardId) : 'Carta boca abajo'"
    @click="clickable && $emit('select', cardId)"
  >
    <template v-if="cardId">
      <span class="tr-card__num tr-card__num--top" :class="`tr-suit--${card.suit}`">{{ card.number }}</span>
      <svg class="tr-card__suit" :class="`tr-suit--${card.suit}`" viewBox="0 0 40 40" aria-hidden="true">
        <template v-if="card.suit === 'oro'">
          <circle cx="20" cy="20" r="14" fill="currentColor" />
          <circle cx="20" cy="20" r="9" fill="none" stroke="#fff7d6" stroke-width="2" />
          <circle cx="20" cy="20" r="3" fill="#fff7d6" />
        </template>
        <template v-else-if="card.suit === 'copa'">
          <path d="M9 7h22c0 9-4 15-9 16v6h5v4H13v-4h5v-6c-5-1-9-7-9-16z" fill="currentColor" />
          <path d="M13 11h14" stroke="#fde2e2" stroke-width="2" />
        </template>
        <template v-else-if="card.suit === 'espada'">
          <path d="M20 3l4 6v19h-8V9z" fill="currentColor" />
          <rect x="11" y="27" width="18" height="3" rx="1.5" fill="currentColor" />
          <rect x="18" y="30" width="4" height="6" rx="1" fill="currentColor" />
        </template>
        <template v-else>
          <path d="M16 36l2-26c0-4 1-7 4-7s4 3 3 7l-2 26z" fill="currentColor" />
          <circle cx="17" cy="15" r="2.4" fill="currentColor" />
          <circle cx="25" cy="22" r="2.4" fill="currentColor" />
          <circle cx="16.5" cy="28" r="2.4" fill="currentColor" />
        </template>
      </svg>
      <span class="tr-card__num tr-card__num--bottom" :class="`tr-suit--${card.suit}`">{{ card.number }}</span>
    </template>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { cardLabel, parseCardId } from '../../utils/cards.js';

const props = defineProps({
  cardId: { type: String, default: null }, // null = boca abajo
  size: { type: String, default: 'md' }, // sm | md | lg
  clickable: Boolean,
  dim: Boolean
});
defineEmits(['select']);

const card = computed(() => (props.cardId ? parseCardId(props.cardId) : null));
</script>

<style scoped>
.tr-card {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 9px;
  border: 1px solid #d6cfae;
  background: linear-gradient(160deg, #fffdf3, #f6efd6);
  box-shadow: 0 3px 8px rgba(2, 6, 23, 0.25);
  font: inherit;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}

.tr-card--sm { width: 44px; height: 64px; }
.tr-card--md { width: 60px; height: 88px; }
.tr-card--lg { width: 78px; height: 114px; }

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

.tr-card__suit { width: 58%; height: 58%; }

.tr-card__num {
  position: absolute;
  font-weight: 800;
  line-height: 1;
  font-size: 0.95rem;
}

.tr-card--sm .tr-card__num { font-size: 0.75rem; }
.tr-card--lg .tr-card__num { font-size: 1.15rem; }

.tr-card__num--top { top: 5px; left: 6px; }
.tr-card__num--bottom { bottom: 5px; right: 6px; transform: rotate(180deg); }

.tr-suit--oro { color: #b7791f; }
.tr-suit--copa { color: #b91c1c; }
.tr-suit--espada { color: #1d4ed8; }
.tr-suit--basto { color: #3f6212; }
</style>
