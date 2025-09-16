<script setup>
  import { onMounted, ref } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";

  const center = [37.7749, -122.4194];
  const initMap = function() {
    const map = L.map("mapContainer").setView(center, 13);
    const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), 
        {
          attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
          minZoom: 0
    });

    tileLayer.addTo(map)
  }

  onMounted(initMap);
</script>

<template>
  <div id="container">
    <h1>Vue + leaflet starter</h1>
    <div id="mapContainer">

    </div>
  </div>
</template>


<style scoped>
#mapContainer {
 width: 90vw;
 height: 80vh;
}
</style>
