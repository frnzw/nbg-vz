<script setup></script>
<template>
  <v-tabs :model-value="route.path">
    <v-tab to="/map/places" value="/map/places"> Places View </v-tab>
    <v-tab to="/map/persons" value="/map/persons"> Persons View </v-tab>
    <v-tab to="/map/distant" value="/map/persons"> Distant View </v-tab>
  </v-tabs>
</template>
