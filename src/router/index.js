import { createRouter, createWebHistory } from 'vue-router';
import PlacesView from '../views/PlacesView.vue'
import PersonsView from '../views/PersonsView.vue'
import PersonTracesView from '../views/PersonTracesView.vue'
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
            path: '/map/traces',
            props: route => ({ persId: route.query.persId  }),
            name: 'traces',
            component: PersonTracesView,
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