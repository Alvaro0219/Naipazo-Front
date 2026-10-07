<template>
  <div class="tr-hand" :class="{ 'tr-hand--active': canPlay }" role="group" aria-label="Tus cartas">
    <PlayingCard
      v-for="cardId in cards"
      :key="cardId"
      :card-id="cardId"
      size="lg"
      :clickable="canPlay"
      @select="$emit('play', $event)"
    />
  </div>
</template>

<script setup>
import PlayingCard from './PlayingCard.vue';

defineProps({
  cards: { type: Array, required: true },
  canPlay: Boolean
});
defineEmits(['play']);
</script>

<style scoped>
.tr-hand {
  display: flex;
  justify-content: center;
  gap: 10px;
  min-height: 143px;
  padding-top: 8px;
}
</style>
