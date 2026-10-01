import { computed, onBeforeUnmount, ref, unref, watch } from 'vue';

/**
 * Cuenta regresiva reactiva hasta `targetRef` (Date | string ISO | null).
 * Llama a `onExpire` una sola vez cuando llega a cero.
 * Se reutiliza para el próximo crédito diario y, más adelante, el timer de turno.
 */
export function useCountdown(targetRef, { onExpire, intervalMs = 1000 } = {}) {
  const now = ref(Date.now());
  let timer = null;
  let expiredFor = null;

  const targetMs = computed(() => {
    const value = unref(targetRef);
    return value ? new Date(value).getTime() : null;
  });

  const remainingMs = computed(() => (targetMs.value === null ? null : Math.max(0, targetMs.value - now.value)));

  function tick() {
    now.value = Date.now();
    if (targetMs.value !== null && remainingMs.value === 0 && expiredFor !== targetMs.value) {
      expiredFor = targetMs.value;
      onExpire?.();
    }
  }

  function start() {
    stop();
    tick();
    timer = setInterval(tick, intervalMs);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  watch(targetMs, (value) => (value === null ? stop() : start()), { immediate: true });
  onBeforeUnmount(stop);

  return { remainingMs };
}
