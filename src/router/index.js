import { createRouter, createWebHistory } from 'vue-router';
// import HomeView from '@/views/HomeView.vue'
import PlacesView from '../views/PlacesView.vue'
import PersonsView from '../views/PersonsView.vue'
import DistantView from '../views/DistantView.vue'
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
            component: PlacesView,
        },
        {
            path: '/map/persons',
            name: 'persons',
            component: PersonsView,
        },
        {
            path: '/map/distant',
            name: 'distant',
            component: DistantView,
        },


        // {
        //     path: '/:catchAll(.*)',
        //     name: 'not-found',
        //     component: NotFoundView,
        // },
    ]
});

export default router;