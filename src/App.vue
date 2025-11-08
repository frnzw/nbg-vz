<script setup>
  import { useRoute, RouterView } from 'vue-router';

  /**
   * @type {import('vue-router').RouteLocationNormalizedLoaded}
   * The current route object, used to set the active tab in the `v-tabs` component.
   */
  const route = useRoute();
</script>

<template>
  <v-app>
    <!-- App Bar Header -->
    <v-app-bar app :elevation="2">
      <!-- Main application title -->
      <v-app-bar-title>Herrnhut WWW (Wer, wo, wann)</v-app-bar-title>

      <!-- Tab Navigation -->
      <!-- The `v-tabs` are bound to the current route path to automatically highlight the active tab. -->
      <v-tabs :model-value="route.path" align-tabs="center">
        <!-- Each `v-tab` uses `to` prop for router navigation and `value` for matching the path. -->
        <v-tab to="/map/places" value="/map/places"> Ort:Personal </v-tab>
        <v-tab to="/map/population" value="/map/population">
          Ort:Gemeinde
        </v-tab>
        <v-tab to="/map/traces" value="/map/traces"> Traces </v-tab>
        <v-tab to="/map/distant" value="/map/distant"> Distant View </v-tab>
        <v-tab to="/about" value="/about"> About </v-tab>
      </v-tabs>
    </v-app-bar>

    <!-- Main Content -->
    <!-- The `v-main` component holds the content for the current route. -->
    <!-- `RouterView` renders the component corresponding to the current URL. -->
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
