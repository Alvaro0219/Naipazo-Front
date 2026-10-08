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
  border-radius: var(--radio-boton);
  background: var(--noche-2);
  border: 1px solid var(--linea);
  color: var(--texto);
  font-size: 14px;
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
  color: var(--texto-suave);
}

.tr-score__row--me .tr-score__name { color: var(--texto); font-weight: 700; }

.tr-score__points {
  font-family: var(--fuente-titulo);
  font-size: 20px;
  font-weight: 700;
  color: var(--celeste-vivo);
}

.tr-score__section {
  font-size: 12px;
  color: var(--texto-suave);
}

.tr-score__target {
  font-size: 12px;
  color: var(--texto-suave);
  text-align: right;
}
</style>
