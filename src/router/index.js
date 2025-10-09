import { createRouter, createWebHistory } from 'vue-router';
import MapView from '../views/MapView.vue'
//import NotFoundView from '@/views/NotFoundView.vue'

const router = createRouter({
    history : createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/map/places'
          },
        {
            path: '/map/places',
            name: 'places',
            component: MapView,
        },
        {
            path: '/map/persons',
            name: 'persons',
            component: MapView,
        },
        {
            path: '/map/traces',
            name: 'traces',
            component: MapView,
        },
        // {
        //     path: '/map/distant',
        //     name: 'distant',
        //     component: DistantView,
        // },


        // {
        //     path: '/:catchAll(.*)',
        //     name: 'not-found',
        //     component: NotFoundView,
        // },
    ]
});

export default router;