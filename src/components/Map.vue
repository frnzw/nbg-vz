<script setup>
  import { onMounted, ref, watch } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import PlacesLayer from './PlacesLayer.vue'
  import TimeSlider from './TimeSlider.vue'
  import DisplayValue from "./DisplayValue.vue"
  import PersonsLayer from './PersonsLayer.vue'
  import PersonTraces from './PersonTraces.vue'
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  const queryPersId = ref('')

  watch(route, () => {
    console.log(`route changed to ${route.path} with params ${JSON.stringify(route.query)}`)
    if (route.path === '/map/traces' && route.query.persId) queryPersId.value = route.query.persId
  });

  const emit = defineEmits(['mapIsReady']) // for passing map to parent component

  const sliderValue = ref(1828); 
  const dateSliderValue = ref(new Date('1828-12-31').getTime())

  let globalMap = undefined;

  const personSelectedFromPlace = ref('')

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


  const switchToPersonView = function(persId) {
    console.log('caught event person-selected!')
    personSelectedFromPlace.value = persId
    router.push({ name: 'traces' })
  }

</script>

<template>
<div id="mapContainer"></div>
  <v-container>
    <TimeSlider  v-model="dateSliderValue"class="pt-4"/>
    <display-value :value="`${dateSliderValue}  = ${new Date(dateSliderValue).toDateString()}`" />
  </v-container>
<PlacesLayer v-if="route.path === '/map/places'" @person-selected="switchToPersonView" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue"/>
<PersonsLayer v-if="route.path === '/map/persons'" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue"/>
<PersonTraces v-if="route.path === '/map/traces'" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue" :persId="personSelectedFromPlace"/>

</template>


<style scoped>
#mapContainer {
width: 100vw;
height: 90%;

}
</style>