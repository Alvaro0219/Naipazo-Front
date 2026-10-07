<template>
  <!-- Hoja de contacto de las 40 cartas (EXACTITUD_DEL_JUEGO.md, F-01). Solo existe en desarrollo: /dev/cartas -->
  <main class="tr-contact">
    <h1>Las 40 cartas</h1>
    <section v-for="suit in SUITS" :key="suit" class="tr-contact__suit">
      <h2>{{ suit }}</h2>
      <div class="tr-contact__row">
        <figure v-for="n in NUMBERS" :key="n" class="tr-contact__item">
          <PlayingCard :card-id="`${n}-${suit}`" size="lg" />
          <figcaption>{{ cardLabel(`${n}-${suit}`) }}</figcaption>
        </figure>
      </div>
    </section>
  </main>
</template>

<script setup>
import PlayingCard from '../../components/game/PlayingCard.vue';
import { cardLabel } from '../../utils/cards.js';

const SUITS = ['espada', 'basto', 'oro', 'copa'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
</script>

<style scoped>
.tr-contact {
  min-height: 100vh;
  padding: 16px;
  background: #14532d;
  color: #fff;
}

.tr-contact h1 { margin: 0 0 12px; font-size: 1.3rem; }
.tr-contact h2 { margin: 16px 0 8px; font-size: 1rem; text-transform: capitalize; }

.tr-contact__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tr-contact__item {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}
</style>
