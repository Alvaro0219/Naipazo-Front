<template>
  <div class="tr-score" role="group" aria-label="Marcador">
    <div v-for="row in rows" :key="row.team" class="tr-score__row" :class="{ 'tr-score__row--me': row.mine }">
      <span class="tr-score__name">{{ row.name }}</span>
      <span class="tr-score__points tr-num">{{ row.points }}</span>
      <span v-if="row.section" class="tr-score__section">{{ row.section }}</span>
    </div>
    <div class="tr-score__target">a {{ targetPoints }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: { type: Array, required: true },
  sections: { type: Array, default: () => [] }, // 'malas' | 'buenas' | null por equipo
  myTeam: { type: Number, required: true },
  opponentName: { type: String, default: 'Rival' },
  myLabel: { type: String, default: 'Vos' }, // 2 vs 2: "Nosotros"
  targetPoints: { type: Number, required: true }
});

const rows = computed(() => [props.myTeam, 1 - props.myTeam].map((team) => ({
  team,
  mine: team === props.myTeam,
  name: team === props.myTeam ? props.myLabel : props.opponentName,
  points: props.score[team],
  section: props.sections[team]
})));
</script>

<style scoped>
.tr-score {
  display: grid;
  gap: 2px;
  min-width: 128px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 0.85rem;
}

.tr-score__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.tr-score__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.8);
}

.tr-score__row--me .tr-score__name { color: #fef9c3; font-weight: 700; }

.tr-score__points {
  font-size: 1.1rem;
  font-weight: 800;
}

.tr-score__section {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.65);
}

.tr-score__target {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
}
</style>
