import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const Login = () => import('../pages/login.vue');
const Register = () => import('../pages/register.vue');
const Terms = () => import('../pages/terms.vue');
const AppLayout = () => import('../layouts/AppLayout.vue');
const Lobby = () => import('../pages/lobby/index.vue');
const Wallet = () => import('../pages/wallet.vue');

const routes = [
  { path: '/login', component: Login, meta: { public: true, guestOnly: true } },
  { path: '/registro', component: Register, meta: { public: true, guestOnly: true } },
  { path: '/terminos', component: Terms, meta: { public: true } },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'lobby', component: Lobby },
      { path: 'billetera', name: 'wallet', component: Wallet }
    ]
  },
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
