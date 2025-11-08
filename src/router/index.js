/**
 * @file router/index.js
 *
 * Configures the Vue Router for the application.
 * This file defines all the application's routes, their corresponding
 * components, and navigation guards.
 */

// Import necessary functions from vue-router
import { createRouter, createWebHistory } from 'vue-router';

// Import the "View" components that correspond to top-level routes
import MapView from '../views/MapView.vue';
import AboutView from '../views/AboutView.vue';
import NotFoundView from '../views/NotFoundView.vue';

/**
 * @type {import('vue-router').Router}
 * The main router instance for the application.
 */
const router = createRouter({
  /**
   * Configures the router to use HTML5 history mode,
   * enabling "clean" URLs without the hash (#).
   * `import.meta.env.BASE_URL` is used for correct pathing in production builds.
   */
  history: createWebHistory(import.meta.env.BASE_URL),

  /**
   * @type {Array<import('vue-router').RouteRecordRaw>}
   * An array of route objects that define the application's pages.
   */
  routes: [
    /**
     * @route {/}
     * The home/root path. This route redirects the user
     * to the default map view ('/map/places').
     */
    {
      path: '/',
      name: 'home',
      redirect: '/map/places',
    },
    /**
     * @route {/map/places}
     * The "Ort: Personal" map view.
     * Renders the MapView component.
     */
    {
      path: '/map/places',
      name: 'places',
      component: MapView,
    },
    /**
     * @route {/map/population}
     * The "Ort: Gemeinde" map view.
     * Renders the MapView component.
     */
    {
      path: '/map/population',
      name: 'population',
      component: MapView,
    },
    /**
     * @route {/map/traces}
     * The "Person: Traces" map view.
     * Renders the MapView component.
     */
    {
      path: '/map/traces',
      name: 'traces',
      component: MapView,
    },
    /**
     * @route {/map/distant}
     * The "Distant View" map view.
     * Renders the MapView component.
     */
    {
      path: '/map/distant',
      name: 'distant',
      component: MapView,
    },
    /**
     * @route {/about}
     * The "About" page.
     * Renders the AboutView component.
     */
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    /**
     * @route {/:catchAll(.*)*}
     * A catch-all route for any path that doesn't match
     * the defined routes. This renders the 404 "Not Found" page.
     */
    {
      path: '/:catchAll(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
});

/**
 * A global navigation guard that runs before each navigation.
 * Currently used for logging the destination route to the console for debugging.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - The target route object.
 * @param {import('vue-router').RouteLocationNormalized} from - The current route object.
 * @param {import('vue-router').NavigationGuardNext} next - The function to resolve the hook.
 */
router.beforeEach((to, from, next) => {
  console.log('Navigating to:', to.fullPath);
  // Call next() to allow the navigation to proceed.
  next();
});

// Export the configured router instance for use in main.js
export default router;
