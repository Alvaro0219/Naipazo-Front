<template>
  <main class="tr-page-shell nz-muestra">
    <header class="tr-page-header">
      <h1>Componentes de Naipazo</h1>
      <p>Página de desarrollo: todos los componentes base con sus estados.</p>
    </header>

    <NzPanel>
      <h2>Marca</h2>
      <div class="nz-muestra__fila">
        <SolDeMayo :size="24" />
        <SolDeMayo :size="40" />
        <SolDeMayo :size="96" resplandor />
        <SolDeMayo :size="96" color="oro" resplandor />
        <SolDeMayo :size="96" color="blanco" />
        <span class="nz-muestra__logo"><SolDeMayo :size="32" /> Naipazo</span>
      </div>
      <div class="nz-muestra__fila">
        <Ficha :size="16" />
        <Ficha :size="24" />
        <Ficha :size="40" />
        <span class="nz-muestra__saldo"><Ficha :size="20" /> 1.000</span>
      </div>
      <div class="nz-muestra__fila">
        <Avatar v-for="n in ['juan', 'Juana', 'pepe.22', 'maria_r', 'X']" :key="n" :nombre="n" />
        <Avatar nombre="grande" :size="72" />
      </div>
      <p class="nz-muestra__nota">El palo del avatar sale del nombre: siempre el mismo para el mismo usuario.</p>
    </NzPanel>

    <NzPanel>
      <h2>Íconos</h2>
      <div class="nz-muestra__iconos">
        <span v-for="nombre in iconos" :key="nombre" class="nz-muestra__icono">
          <Icono :nombre="nombre" :size="24" />
          <small>{{ nombre }}</small>
        </span>
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Botones</h2>
      <div class="nz-muestra__fila">
        <NzBoton variante="principal" label="Crear partida" />
        <NzBoton variante="principal" label="Cargando" loading />
        <NzBoton variante="principal" label="Deshabilitado" disable />
      </div>
      <div class="nz-muestra__fila">
        <NzBoton variante="luminoso" tamano="lg" label="Truco" />
        <NzBoton variante="luminoso" tamano="lg" label="Envido" />
        <NzBoton variante="luminoso" label="Unirme" />
        <NzBoton variante="luminoso" label="Deshabilitado" disable />
      </div>
      <div class="nz-muestra__fila">
        <NzBoton variante="luminoso" tono="verde" tamano="xl" icono="tilde" label="Quiero" />
        <NzBoton variante="luminoso" tono="rojo" tamano="xl" icono="cerrar" label="No quiero" />
      </div>
      <div class="nz-muestra__fila">
        <NzBoton variante="secundario" label="Secundario" />
        <NzBoton variante="secundario" icono="copiar" label="Copiar código" />
        <NzBoton variante="secundario" tono="rojo" label="Cancelar mesa" />
        <NzBoton variante="secundario" tamano="sm" label="Chico" />
      </div>
      <div class="nz-muestra__fila">
        <NzBoton variante="texto" label="Cancelar" />
        <NzBoton variante="texto" label="Me voy al mazo" />
        <NzBoton variante="texto" tono="rojo" label="Salir" />
        <NzBoton variante="texto" solo-icono icono="sonido" label="Sonido" />
        <NzBoton variante="texto" solo-icono icono="cerrar" label="Salir de la mesa" />
      </div>
      <p class="nz-muestra__nota">Al presionar, el botón se achica a 0,97 y su brillo sube un nivel. Con teclado, anillo celeste.</p>
    </NzPanel>

    <NzPanel>
      <h2>Campos</h2>
      <div class="column q-gutter-y-md nz-muestra__campos">
        <NzCampo v-model="texto" label="Nombre de usuario" hint="3 a 20 caracteres" />
        <NzCampo v-model="vacio" label="Email" placeholder="vos@ejemplo.com" />
        <NzCampo v-model="conError" label="Contraseña" type="password" error error-message="Mínimo 8 caracteres" />
        <NzCampo v-model="texto" label="Deshabilitado" disable />
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Selector segmentado</h2>
      <div class="column q-gutter-y-md">
        <NzSegmentado
          v-model="seg"
          aria-label="Tipo"
          :opciones="[{ label: 'Todas', value: 'all' }, { label: 'Mesas', value: 'room' }, { label: 'Torneos', value: 'tournament' }]"
        />
        <NzSegmentado v-model="puntos" bloque aria-label="Puntos" :opciones="[{ label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]" />
        <NzSegmentado
          v-model="seg2"
          aria-label="Con una deshabilitada"
          :opciones="[{ label: 'Uno', value: 1 }, { label: 'Dos', value: 2 }, { label: 'No se puede', value: 3, disable: true }]"
        />
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Chips</h2>
      <div class="nz-muestra__fila">
        <NzChip label="A 15" />
        <NzChip label="500 fichas" />
        <NzChip label="2 vs 2" icono="pareja" />
        <NzChip tono="celeste" label="En juego" />
        <NzChip tono="oro" label="Ganaste" />
        <NzChip tono="verde" label="Activo" />
        <NzChip tono="rojo" label="Bloqueado" />
        <NzChip tono="ambar" label="Pausa" />
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Paneles</h2>
      <div class="column q-gutter-y-md">
        <NzPanel tag="div">Panel en reposo (noche-2, borde fino, sin sombra).</NzPanel>
        <NzPanel tag="div" elevado>Panel elevado (noche-3): saldo y avisos.</NzPanel>
        <NzPanel tag="div" luz>Panel con luz: solo lo accionable más importante de la pantalla.</NzPanel>
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Avisos</h2>
      <div class="column q-gutter-y-sm">
        <NzAviso>Información: tu mesa ya aparece en el lobby.</NzAviso>
        <NzAviso tono="verde">Listo: tu email quedó verificado.</NzAviso>
        <NzAviso tono="rojo">Error: el enlace está incompleto.</NzAviso>
        <NzAviso tono="ambar">Mantenimiento: en 10 minutos se reinicia el servidor.</NzAviso>
        <NzAviso icono="emailPendiente">
          Verificá tu email para recibir tus fichas diarias.
          <template #accion><NzBoton variante="secundario" tamano="sm" icono="enviar" label="Reenviar" /></template>
        </NzAviso>
      </div>
      <div class="nz-muestra__fila q-mt-md">
        <NzBoton variante="secundario" tamano="sm" label="Aviso de éxito" @click="$q.notify({ type: 'positive', message: 'Se creó la mesa.' })" />
        <NzBoton variante="secundario" tamano="sm" label="Aviso de error" @click="$q.notify({ type: 'negative', message: 'No te alcanzan las fichas.' })" />
        <NzBoton variante="secundario" tamano="sm" label="Aviso informativo" @click="$q.notify({ type: 'info', message: 'Tu rival se reconectó.' })" />
        <NzBoton variante="secundario" tamano="sm" label="Aviso de atención" @click="$q.notify({ type: 'warning', message: 'Te quedan 5 segundos.' })" />
      </div>
    </NzPanel>

    <NzPanel>
      <h2>Hojas inferiores</h2>
      <div class="nz-muestra__fila">
        <NzBoton variante="secundario" label="Abrir hoja" @click="hoja = true" />
        <NzBoton variante="secundario" label="Confirmación" @click="confirmarNormal" />
        <NzBoton variante="secundario" tono="rojo" label="Confirmación destructiva" @click="confirmarDestructiva" />
      </div>
      <NzHoja v-model="hoja" titulo="Crear partida">
        <p class="nz-muestra__nota">En el celular sale desde abajo; en escritorio, centrada.</p>
        <NzSegmentado v-model="puntos" bloque aria-label="Puntos" :opciones="[{ label: 'A 15', value: 15 }, { label: 'A 30', value: 30 }]" />
        <template #acciones>
          <NzBoton variante="texto" label="Cancelar" @click="hoja = false" />
          <NzBoton variante="principal" label="Crear mesa" @click="hoja = false" />
        </template>
      </NzHoja>
    </NzPanel>

    <NzPanel>
      <h2>Carga, espera y vacío</h2>
      <NzSkeleton :filas="2" :alto="56" />
      <div class="nz-muestra__fila q-mt-md">
        <div class="nz-anillo" aria-hidden="true" />
        <span class="nz-anillo nz-anillo--chico" aria-hidden="true" />
      </div>
      <NzVacio texto="Todavía no hay partidas abiertas. Creá la primera.">
        <NzBoton variante="principal" icono="mas" label="Crear partida" />
      </NzVacio>
    </NzPanel>

    <NzPanel>
      <h2>Colores de montos</h2>
      <div class="nz-muestra__fila tr-num">
        <span class="nz-monto--oro">+400 premio</span>
        <span class="nz-monto--texto">+1.000 crédito diario</span>
        <span class="nz-monto--verde">+500 devolución</span>
        <span class="nz-monto--suave">−100 apuesta</span>
      </div>
    </NzPanel>
  </main>
</template>

<script setup>
// Muestra de componentes base (ESTILOS_NAIPAZO.md, N1). Solo existe en desarrollo: /dev/componentes
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { ICONOS, PROPIOS } from '../../components/ui/Icono.vue';
import { confirmar } from '../../composables/useConfirmar.js';

const $q = useQuasar();
const iconos = [...Object.keys(PROPIOS), ...Object.keys(ICONOS)];
const texto = ref('pepe.22');
const vacio = ref('');
const conError = ref('1234');
const seg = ref('all');
const seg2 = ref(1);
const puntos = ref(15);
const hoja = ref(false);

function confirmarNormal() {
  confirmar({
    title: 'Mesa por 500 fichas',
    message: 'Al empezar se descuentan 500 fichas de tu saldo. Si ganás te llevás el pozo.',
    cancel: { label: 'Cancelar' },
    ok: { label: 'Jugar' }
  });
}

function confirmarDestructiva() {
  confirmar({
    title: '¿Salir de la partida?',
    message: 'Si salís, perdés la partida y la apuesta.',
    cancel: { label: 'Seguir jugando' },
    ok: { label: 'Salir', color: 'negative' }
  });
}
</script>

<style scoped>
.nz-muestra h2 { margin: 0 0 12px; font-size: 20px; }

.nz-muestra__fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.nz-muestra__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--fuente-titulo);
  font-size: 20px;
  font-weight: 700;
}

.nz-muestra__saldo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--fuente-titulo);
  font-weight: 700;
}

.nz-muestra__iconos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}

.nz-muestra__icono {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--texto);
}

.nz-muestra__icono small { color: var(--texto-suave); font-size: 12px; }

.nz-muestra__campos { max-width: 420px; }

.nz-muestra__nota { margin: 0; color: var(--texto-suave); font-size: 13px; }
</style>
