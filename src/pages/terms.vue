<template>
  <div class="tr-page-shell tr-terms">
    <header class="tr-page-header">
      <h1>Términos y condiciones</h1>
      <p>Naipazo: truco online con fichas virtuales</p>
    </header>

    <section class="tr-section-card">
      <h2>1. Fichas virtuales</h2>
      <p>
        Las fichas son virtuales, <strong>no tienen valor monetario y no son canjeables</strong> por dinero,
        bienes, servicios ni premios de ningún tipo. No se pueden comprar, vender, transferir ni retirar.
      </p>
      <p>
        Solo se obtienen mediante el crédito diario gratuito (que requiere tener el email verificado) y ganando partidas o torneos. El saldo puede ser ajustado
        por la administración para corregir errores o abusos.
      </p>
    </section>

    <section class="tr-section-card">
      <h2>2. Mayoría de edad</h2>
      <p>Para usar la plataforma tenés que ser mayor de 18 años. Al registrarte lo declarás bajo tu responsabilidad.</p>
    </section>

    <section class="tr-section-card">
      <h2>3. Juego limpio</h2>
      <p>
        No está permitido usar varias cuentas, coordinar resultados con otros jugadores, perder a propósito
        para pasarle fichas a otra cuenta, ni usar programas que automaticen jugadas.
      </p>
      <p>
        <strong>Está prohibido vender, comprar o transferir fichas o cuentas</strong>, dentro o fuera de la
        plataforma. Las cuentas que incumplan estas reglas pueden ser bloqueadas y su saldo ajustado.
      </p>
      <p>
        Las partidas de salas privadas no cuentan para el ranking y tienen un tope de apuesta.
      </p>
    </section>

    <section class="tr-section-card">
      <h2>4. Tu cuenta</h2>
      <p>
        Sos responsable de mantener tu contraseña en secreto. El nombre de usuario es público (se muestra en
        las mesas y en el ranking) y no se puede cambiar.
      </p>
    </section>

    <q-btn flat no-caps color="primary" icon="arrow_back" label="Volver" class="self-start" @click="goBack" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push('/registro');
}
</script>

<style scoped>
.tr-terms p {
  margin: 0 0 8px;
  color: #334155;
  line-height: 1.55;
}

.tr-terms p:last-child { margin-bottom: 0; }
</style>
