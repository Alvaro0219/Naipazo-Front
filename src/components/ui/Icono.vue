<template>
  <svg
    v-if="propio"
    class="nz-icono"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
    focusable="false"
    v-html="propio"
  />
  <component
    :is="componente"
    v-else
    class="nz-icono"
    :size="size"
    :stroke-width="1.75"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
  />
</template>

<script>
// Un solo set de íconos de trazo (ESTILOS_NAIPAZO.md, 4.1): Lucide con trazo de 1,75 px y extremos redondeados,
// más los dibujos propios (naipe y palos) con la misma geometría.
import {
  ArrowLeft, ArrowRight, Ban, BadgeCheck, Bell, Check, ChevronDown, ChevronRight, CircleAlert, CircleCheck, CirclePause,
  CircleX, Clock, Copy, Flag, Gift, Hand, History, Hourglass, Info, Lock, LogOut, MailCheck, MailWarning, Medal, Minus,
  Plus, ReceiptText, RefreshCw, RotateCcw, Scale, Search, SearchX, Send, Settings, ShieldCheck, ThumbsUp, Trophy, User,
  UserCog, UserSearch, Users, Volume2, VolumeX, Wallet, X, AppWindow, Eye, EyeOff
} from 'lucide-vue-next';

/** Nombre → ícono de Lucide. Es la única lista de íconos de la app: si falta uno, se agrega acá. */
export const ICONOS = {
  volver: ArrowLeft,
  avanzar: ArrowRight,
  bloqueado: Ban,
  verificado: BadgeCheck,
  aviso: Bell,
  tilde: Check,
  desplegar: ChevronDown,
  siguiente: ChevronRight,
  alerta: CircleAlert,
  ok: CircleCheck,
  pausa: CirclePause,
  cruz: CircleX,
  reloj: Clock,
  copiar: Copy,
  bandera: Flag,
  regalo: Gift,
  mano: Hand,
  historial: History,
  espera: Hourglass,
  info: Info,
  candado: Lock,
  salir: LogOut,
  emailOk: MailCheck,
  emailPendiente: MailWarning,
  medalla: Medal,
  menos: Minus,
  mas: Plus,
  movimientos: ReceiptText,
  actualizar: RefreshCw,
  revancha: RotateCcw,
  balanza: Scale,
  buscar: Search,
  sinResultados: SearchX,
  enviar: Send,
  ajustes: Settings,
  seguro: ShieldCheck,
  listo: ThumbsUp,
  trofeo: Trophy,
  perfil: User,
  admin: UserCog,
  buscarUsuario: UserSearch,
  pareja: Users,
  sonido: Volume2,
  sinSonido: VolumeX,
  billetera: Wallet,
  cerrar: X,
  pestana: AppWindow,
  ver: Eye,
  ocultar: EyeOff
};

/** Dibujos propios (viewBox 24, trazo 1,75): naipe y los cuatro palos de la baraja española. */
export const PROPIOS = {
  naipe: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9.5 7.5h0M14.5 16.5h0"/><circle cx="12" cy="12" r="2.2"/>',
  naipes: '<rect x="8" y="4" width="11" height="16" rx="2"/><path d="M5.5 7.2 5 8.2v9.6c0 1.1.9 2 2 2"/>',
  espada: '<path d="M12 2.8 14 6v10h-4V6z"/><path d="M7.5 16h9M12 16v5"/>',
  basto: '<path d="M9.2 21c-.6-4.6-.7-9.4.2-14.2.5-2.6 4.6-2.6 5.2 0 .9 4.8.8 9.6.2 14.2z"/><path d="M10.6 10.5h.01M13.4 14h.01M10.7 17.5h.01"/>',
  oro: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/>',
  copa: '<path d="M6.5 4h11c0 5-2.4 8-5.5 8.5C8.9 12 6.5 9 6.5 4z"/><path d="M12 12.5V18M8.5 20.5h7M9.5 18h5"/>'
};
</script>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  nombre: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  // Si el ícono comunica algo por sí solo (sin texto al lado), su descripción para lectores de pantalla
  label: { type: String, default: '' }
});

const propio = computed(() => PROPIOS[props.nombre] || null);
const componente = computed(() => {
  const c = ICONOS[props.nombre];
  if (!c && !PROPIOS[props.nombre] && import.meta.env.DEV) console.warn(`[Icono] no existe "${props.nombre}"`);
  return c || CircleAlert;
});
</script>

<style scoped>
.nz-icono {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
