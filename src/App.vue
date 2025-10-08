<script setup>
    import { useRoute } from 'vue-router'
    import Map from './components/Map.vue'
    
    const route = useRoute()

</script>

<template>
  <v-app>

    <!-- App Bar Header -->
      <v-app-bar app :elevation="2">
        <!-- <template v-slot:prepend>
          <v-app-bar-nav-icon></v-app-bar-nav-icon>
        </template> -->
        <v-app-bar-title>Herrnhut WWW (Wer, wo, wann)</v-app-bar-title>

        <!-- Tab Navigation -->
        <v-tabs :model-value="route.path" align-tabs="center">
          <v-tab to="/map/places" value="/map/places">
            Places View
          </v-tab>
          <v-tab to="/map/persons" value="/map/persons">
            Persons View
          </v-tab>
          <v-tab to="/map/persons-traces" value="/map/persons-traces">
            Traces View
          </v-tab>

        </v-tabs>

      </v-app-bar>

      <!-- Main Content -->
      <v-main>
      
        <!-- Global Map Instance for all map views-->
        <!-- When bringing in other views (About, Data): use v-if / v-else to render map -->
        <Map />
      
        <!-- <RouterView /> -->

      </v-main>

  </v-app>

</template>
