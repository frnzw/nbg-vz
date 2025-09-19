<script setup>
  import { onMounted, ref } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import PlacesLayer from './PlacesLayer.vue'
  import Slider from './Slider.vue'
  import PersonsLayer from './PersonsLayer.vue'
  import DistantLayer from './DistantLayer.vue'
  import { useRoute } from 'vue-router'

  // import { useMapStore } from '../stores/mapStore'

  const route = useRoute()

  const emit = defineEmits(['mapIsReady']) // for passing map to parent component

  const center = [30, 0];

  const testProp = "hello prop!";

  let globalMap = undefined;

  const initMap = function() {
    const map = L.map("mapContainer").fitWorld().zoomIn() //.setView(center, 2);
    /**
     * @todo set minZoom and initial view dependent on screen size: large screen needs minZoom 3 for initial view / overview
     */
    const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), 
        {
          attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
          minZoom: 2
    });

    tileLayer.addTo(map)

    globalMap = map
  }

  onMounted(async () => {
    initMap();
    
    emit('mapIsReady', globalMap) // pass map to parent component
  });

</script>

<template>
<div id="mapContainer"></div>
<Slider />
<PlacesLayer v-if="route.path === '/map/places'" :map="globalMap"/>
<PersonsLayer v-if="route.path === '/map/persons'" :map="globalMap"/>
<DistantLayer v-if="route.path === '/map/distant'" :map="globalMap"/>
</template>


<style scoped>
#mapContainer {
width: 100vw;
height: 90%;

}
</style>