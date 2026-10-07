import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const Login = () => import('../pages/login.vue');
const Register = () => import('../pages/register.vue');
const Terms = () => import('../pages/terms.vue');
const Privacy = () => import('../pages/privacy.vue');
const ForgotPassword = () => import('../pages/forgot-password.vue');
const ResetPassword = () => import('../pages/reset-password.vue');
const VerifyEmail = () => import('../pages/verify-email.vue');
const AppLayout = () => import('../layouts/AppLayout.vue');
const Lobby = () => import('../pages/lobby/index.vue');
const Wallet = () => import('../pages/wallet.vue');
const Table = () => import('../pages/table.vue');
const History = () => import('../pages/history/index.vue');
const MatchDetail = () => import('../pages/history/detail.vue');
const Ranking = () => import('../pages/ranking.vue');
const Profile = () => import('../pages/profile.vue');
const Admin = () => import('../pages/admin/index.vue');
const TournamentDetail = () => import('../pages/tournaments/detail.vue');

const routes = [
  { path: '/login', component: Login, meta: { public: true, guestOnly: true } },
  { path: '/registro', component: Register, meta: { public: true, guestOnly: true } },
  { path: '/terminos', component: Terms, meta: { public: true } },
  { path: '/privacidad', component: Privacy, meta: { public: true } },
  { path: '/recuperar', component: ForgotPassword, meta: { public: true, guestOnly: true } },
  // Se abren desde el email: funcionan con o sin sesión iniciada
  { path: '/restablecer', component: ResetPassword, meta: { public: true } },
  { path: '/verificar-email', component: VerifyEmail, meta: { public: true } },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'lobby', component: Lobby },
      { path: 'billetera', name: 'wallet', component: Wallet },
      { path: 'historial', name: 'history', component: History },
      { path: 'historial/:id', name: 'match-detail', component: MatchDetail },
      // Mesas y torneos se listan juntos en el lobby; /torneos queda como atajo
      { path: 'torneos', redirect: '/' },
      { path: 'torneos/:id', name: 'tournament-detail', component: TournamentDetail },
      { path: 'ranking', name: 'ranking', component: Ranking },
      { path: 'perfil', name: 'profile', component: Profile },
      { path: 'admin', name: 'admin', component: Admin, meta: { role: 'admin' } }
    ]
  },
  // La mesa va a pantalla completa, fuera del layout con navegación
  { path: '/mesa/:roomId', component: Table },
  // Solo desarrollo: hoja de contacto de las 40 cartas (EXACTITUD_DEL_JUEGO.md, F-01)
  ...(import.meta.env.DEV ? [{ path: '/dev/cartas', component: () => import('../pages/dev/cards.vue'), meta: { public: true } }] : []),
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (!auth.accessToken) auth.hydrate();

  if (to.meta.guestOnly && auth.isAuthenticated) return { path: '/' };
  if (to.meta.public) return true;
  if (!auth.isAuthenticated) {
    return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} };
  }

  if (to.meta.role && to.meta.role !== auth.user?.role) return { path: '/' };
  return true;
});

export default router;
