<template>
  <div class="tr-page-shell">
    <header class="tr-page-header">
      <h1>¡Hola, {{ auth.user?.username }}!</h1>
      <p>Elegí una mesa o armá la tuya.</p>
    </header>

    <section class="tr-felt">
      <div class="tr-felt__cards" aria-hidden="true">
        <span class="tr-card tr-card--left">1<small>espada</small></span>
        <span class="tr-card tr-card--mid">7<small>oro</small></span>
        <span class="tr-card tr-card--right">3<small>copa</small></span>
      </div>
      <div class="tr-felt__body">
        <h2>Las mesas abren muy pronto</h2>
        <p>Estamos terminando el motor de juego. Mientras tanto, tus fichas del día ya están en la billetera.</p>
        <div class="tr-felt__actions">
          <q-btn color="accent" text-color="dark" unelevated no-caps icon="add" label="Crear sala" disable />
          <q-btn outline color="white" no-caps icon="account_balance_wallet" label="Ver billetera" to="/billetera" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
</script>

<style scoped>
.tr-felt {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 20px;
  border-radius: 18px;
  color: #fff;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.10), transparent 60%),
    #166534;
  box-shadow: inset 0 0 0 6px #14532d, inset 0 0 0 7px rgba(202, 138, 4, 0.5);
}

.tr-felt__cards {
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.tr-card {
  width: 64px;
  height: 92px;
  margin: 0 -6px;
  border-radius: 8px;
  background: #fefce8;
  color: #14532d;
  border: 2px solid #ca8a04;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
}

.tr-card small {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr-card--left { transform: rotate(-10deg) translateY(6px); }
.tr-card--mid { z-index: 1; }
.tr-card--right { transform: rotate(10deg) translateY(6px); }

.tr-felt__body h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
}

.tr-felt__body p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.tr-felt__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

@media (min-width: 768px) {
  .tr-felt {
    flex-direction: row;
    align-items: center;
    gap: 36px;
    padding: 32px;
  }
  .tr-felt__cards { flex-shrink: 0; padding: 0 12px; }
}
</style>
