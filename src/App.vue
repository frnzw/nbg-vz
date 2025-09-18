<script setup>
    import { RouterView, useRoute } from 'vue-router'
    import Map from './components/Map.vue'
    import Navigation from './components/Navigation.vue'

    const route = useRoute()

</script>

<template>
  <v-app>

      <v-app-bar app :elevation="2">
        <template v-slot:prepend>
          <v-app-bar-nav-icon></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>NBG WWW (Wer, wo, wann)</v-app-bar-title>

        <v-tabs :model-value="route.path" align-tabs="center">
          <v-tab to="/map/places" value="/map/places">
            Places View
          </v-tab>
          <v-tab to="/map/persons" value="/map/persons">
            Persons View
          </v-tab>
          <v-tab to="/map/distant" value="/map/persons">
            Distant View
          </v-tab>

        </v-tabs>
      </v-app-bar>

      <v-main>
      
        <Map />
        <!-- <RouterView /> -->

      </v-main>

  </v-app>

</template>
