<template>
  <div class="tr-page-shell tr-terms">
    <header class="tr-page-header">
      <h1>Política de privacidad</h1>
      <p>Qué datos guardamos, para qué y cómo pedir la baja</p>
    </header>

    <section class="tr-section-card">
      <h2>1. Qué datos guardamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre de usuario, email, contraseña (guardada cifrada, nunca en texto) y la fecha en que aceptaste los términos.</li>
        <li><strong>Juego:</strong> tus partidas, torneos, movimientos de fichas virtuales y estadísticas.</li>
        <li><strong>Seguridad:</strong> datos técnicos mínimos (como la dirección IP) para limitar abusos, por ejemplo la cantidad de registros o intentos de inicio de sesión.</li>
      </ul>
      <p>No pedimos DNI, datos bancarios ni medios de pago: las fichas son virtuales y no se compran.</p>
    </section>

    <section class="tr-section-card">
      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Para que puedas entrar, jugar y ver tu historial.</li>
        <li>Para mandarte emails de la cuenta: verificación del email y recuperación de contraseña. No mandamos publicidad.</li>
        <li>Para mantener el juego limpio (detectar varias cuentas o traspasos de fichas).</li>
      </ul>
    </section>

    <section class="tr-section-card">
      <h2>3. Qué es público</h2>
      <p>
        Tu nombre de usuario se muestra en las mesas, los torneos y el ranking, junto con tus estadísticas.
        Tu email nunca se muestra a otros jugadores.
      </p>
    </section>

    <section class="tr-section-card">
      <h2>4. Con quién los compartimos</h2>
      <p>
        No vendemos ni cedemos tus datos. Solo los procesan los servicios que hacen funcionar la app
        (alojamiento, base de datos y envío de emails), únicamente para prestar el servicio.
      </p>
    </section>

    <section class="tr-section-card">
      <h2>5. Baja y acceso a tus datos</h2>
      <p>
        Podés pedir una copia de tus datos o la baja de tu cuenta escribiendo desde el email registrado a la
        dirección de contacto del sitio. Al darte de baja se eliminan tus datos personales; las partidas quedan
        registradas de forma anónima para no alterar el historial de los demás jugadores.
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
.tr-terms p,
.tr-terms li {
  margin: 0 0 8px;
  color: #334155;
  line-height: 1.55;
}

.tr-terms ul {
  margin: 0 0 8px;
  padding-left: 20px;
}
</style>
