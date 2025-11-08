/**
 * @file main.js
 *
 * The main entry point for the Vue.js application.
 * This file is responsible for:
 * 1. Creating the Vue application instance.
 * 2. Creating and registering the Pinia state management.
 * 3. Creating and registering the Vue Router.
 * 4. Creating and registering the Vuetify component library.
 * 5. Importing global CSS, fonts, and icons.
 * 6. Mounting the application to the DOM.
 */

// --- Core Vue Imports ---
import { createApp } from 'vue';
import App from './App.vue';

// --- Plugin Imports ---
import { createPinia } from 'pinia';
import router from './router';

// --- Vuetify Imports ---
// Import global Vuetify styles
import 'vuetify/styles';
// Import functions to create Vuetify
import { createVuetify } from 'vuetify';
// Import all Vuetify components and directives for auto-registration
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// --- Global CSS Imports ---
// Import the main global stylesheet
import './style.css';

// Import Roboto font weights
import '@fontsource/roboto/100.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';

// Import Material Design Icons font
import '@mdi/font/css/materialdesignicons.css';

// --- Vue App Initialization ---

/**
 * @type {import('vue').App}
 * The root Vue application instance.
 */
const app = createApp(App);

/**
 * Register the Vue Router plugin.
 * This makes routing available throughout the application.
 */
app.use(router);

/**
 * @type {import('pinia').Pinia}
 * The Pinia instance for state management.
 */
const pinia = createPinia();
/**
 * Register the Pinia plugin.
 * This makes all stores available to all components.
 */
app.use(pinia);

/**
 * @type {import('vuetify').VuetifyInstance}
 * The Vuetify instance.
 * We register all components and directives for simplicity.
 */
const vuetify = createVuetify({
  components,
  directives,
});
/**
 * Register the Vuetify plugin.
 * This makes all Vuetify components and services available.
 */
app.use(vuetify);

/**
 * Mount the Vue application to the DOM.
 * The app will be rendered inside the HTML element with the id="app".
 */
app.mount('#app');
