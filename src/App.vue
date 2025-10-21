<script setup>
  import { useRoute, RouterView } from 'vue-router';

  const route = useRoute();
</script>

<template>
  <v-app>
    <!-- App Bar Header -->
    <v-app-bar app :elevation="2">
      <v-app-bar-title>Herrnhut WWW (Wer, wo, wann)</v-app-bar-title>

      <!-- Tab Navigation -->
      <v-tabs :model-value="route.path" align-tabs="center">
        <v-tab to="/map/places" value="/map/places"> Ort:Personal </v-tab>
        <v-tab to="/map/population" value="/map/population">
          Ort:Gemeinde
        </v-tab>
        <v-tab to="/map/traces" value="/map/traces"> Traces </v-tab>
        <v-tab to="/map/distant" value="/map/distant"> Distant View </v-tab>
      </v-tabs>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>
