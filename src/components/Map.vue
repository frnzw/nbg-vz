<script setup>
  import { onMounted, ref } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";

  // import { useMapStore } from '../stores/mapStore'


  const emit = defineEmits(['mapIsReady']) // for passing map to parent component

  const center = [37.7749, -122.4194];

  

  const initMap = function() {
    const map = L.map("mapContainer").setView(center, 2);
    const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), 
        {
          attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
          minZoom: 2
    });

    tileLayer.addTo(map)

    return map
  }

  onMounted(async () => {
    const map = initMap();
    emit('mapIsReady', map) // pass map to parent component
  });

</script>

<template>
<div id="mapContainer"></div>
</template>


<style scoped>
#mapContainer {
width: 100vw;
height: 100%;

}
</style>