<template>
  <div class="tr-auth-shell">
    <header class="tr-auth-marca">
      <SolDeMayo :size="72" resplandor />
      <h1 class="tr-auth-marca__nombre">Naipazo</h1>
      <p class="tr-auth-marca__linea">Truco argentino con fichas virtuales</p>
    </header>

    <main class="tr-auth-card">
      <div v-if="titulo" class="tr-auth-card__titulo">
        <h2>{{ titulo }}</h2>
        <p v-if="subtitulo">{{ subtitulo }}</p>
      </div>
      <slot />
    </main>

    <slot name="pie" />
  </div>
</template>

<script setup>
// Pantallas de acceso (ESTILOS_NAIPAZO.md, 10.1): arriba el Sol de Mayo luminoso, "Naipazo" en Bricolage 32 px y una
// línea; debajo, el formulario en un panel noche-2.
defineProps({
  titulo: { type: String, default: '' },
  subtitulo: { type: String, default: '' }
});
</script>

<style scoped>
.tr-auth-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
}

.tr-auth-marca {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.tr-auth-marca__nombre {
  margin: 8px 0 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.tr-auth-marca__linea {
  margin: 0;
  color: var(--texto-suave);
  font-size: 14px;
}

.tr-auth-card {
  width: 100%;
  max-width: 420px;
  padding: 24px 20px;
  background: var(--noche-2);
  border: 1px solid var(--linea);
  border-radius: var(--radio-panel);
}

.tr-auth-card__titulo { margin-bottom: 16px; }

.tr-auth-card__titulo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
}

.tr-auth-card__titulo p {
  margin: 4px 0 0;
  color: var(--texto-suave);
  font-size: 14px;
}
</style>
