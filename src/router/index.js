import { createRouter, createWebHistory } from 'vue-router';
import MapView from '../views/MapView.vue';
import AboutView from '../views/AboutView.vue';
import NotFoundView from '../views/NotFoundView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/map/places',
    },
    {
      path: '/map/places',
      name: 'places',
      component: MapView,
    },
    {
      path: '/map/population',
      name: 'population',
      component: MapView,
    },
    {
      path: '/map/traces',
      name: 'traces',
      component: MapView,
    },
    {
      path: '/map/distant',
      name: 'distant',
      component: MapView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/:catchAll(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
});

router.beforeEach((to, from, next) => {
  console.log('Navigating to:', to.fullPath);
  next();
});

export default router;
