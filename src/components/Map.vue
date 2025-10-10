<script setup>
  import { onMounted, ref, watch, computed } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import PlacesLayer from './PlacesLayer.vue'
  import TimeSlider from './TimeSlider.vue'
  import DisplayValue from "./DisplayValue.vue"
  import PersonsLayer from './PersonsLayer.vue'
  import PersonTraces from './PersonTraces.vue'
  import DistantLayer from './DistantLayer.vue'
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  const emit = defineEmits(['mapIsReady']) // for passing map to parent component

  const sliderValue = ref(1828); 
  const dateSliderValue = ref(new Date('1828-12-31').getTime())

  // reactive switch for checking if props.map is initialized before rendering child components
  // set this in onMounted()
  let mapReady = ref(false)
  let globalMap = undefined;

  // reactive switch for checking if current route is properly accessible before conditionally rendering child components
  // set this in onMounted()
  let readyForPlaceView = ref(false)
  let readyForTraceView = ref(false)
  let readyForPersonView = ref(false)
  let readyForDistantView = ref(false)

  

  const personsSelectedFromPlace = ref([])
  const placesSelectedFromTrace = ref([])

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
    mapReady = true
  }


  onMounted(() => {
    initMap();
    console.log(mapReady);
    console.log(route.path);
    if (mapReady) {
      if (route.path === '/map/places') {
        readyForPlaceView.value = true;

        readyForTraceView.value = false;
        readyForPersonView.value = false;
        readyForDistantView.value = false;
        console.log('ready for place view')
      }
      else if (route.path === '/map/traces') {
        readyForTraceView.value = true;

        readyForPersonView.value = false;
        readyForPlaceView.value = false;
        readyForDistantView.value = false;
        console.log('ready for trace view')
      }
      else if (route.path === '/map/persons') {
        readyForPersonView.value = true;

        readyForPlaceView.value = false;
        readyForTraceView.value = false;
        readyForDistantView.value = false;
        console.log('ready for person view')
      } else if (route.path === '/map/distant') {
        readyForDistantView.value = true;

        readyForPersonView.value = false;
        readyForPlaceView.value = false;
        readyForTraceView.value = false;

      } else {
        console.warn('map component initialized without proper sub route, no additional layers will be visible!')
      }
      
      
    }
    console.log(globalMap)
    // emit('mapIsReady', globalMap) // pass map to parent component
  });


  const switchToPersonView = function(persId) {
    console.log('caught event person-selected!')
    personsSelectedFromPlace.value = [persId]
    router.push({ name: 'traces' })
  }
  

  const clearPreSelectionPerson = function() {
    console.log('caught event person-pre-selection-cleared!')
    personsSelectedFromPlace.value = []
  }

  const switchToPlacesView = function(stationId) {
    console.log('caught event place-selected!')
    placesSelectedFromTrace.value = [stationId]
    router.push({ name: 'places' })
  }

  const clearPreSelectionPlace = function() {
    console.log('caught event place-pre-selection-cleared!')
    placesSelectedFromTrace.value = []
  }

  watch(route, () => {
    console.log(`route changed to ${route.path} with params ${JSON.stringify(route.query)}`)

    if (mapReady) {
      if (route.path === '/map/places') {
        readyForPlaceView.value = true;

        readyForTraceView.value = false;
        readyForPersonView.value = false;
        readyForDistantView.value = false;
        console.log('ready for place view')
      }
      else if (route.path === '/map/traces') {
        readyForTraceView.value = true;

        readyForPersonView.value = false;
        readyForPlaceView.value = false;
        readyForDistantView.value = false;
        console.log('ready for trace view')
      }
      else if (route.path === '/map/persons') {
        readyForPersonView.value = true;

        readyForPlaceView.value = false;
        readyForTraceView.value = false;
        readyForDistantView.value = false;
        console.log('ready for person view')
      } else if (route.path === '/map/distant') {
        readyForDistantView.value = true;

        readyForPersonView.value = false;
        readyForPlaceView.value = false;
        readyForTraceView.value = false;

      } else {
        console.warn('map component initialized without proper sub route, no additional layers will be visible!')
      }
    }


  });
</script>

<template>
<div id="mapContainer"></div>
  <v-container>
    <TimeSlider  v-model="dateSliderValue"class="pt-4"/>
    <display-value :value="`${dateSliderValue}  = ${new Date(dateSliderValue).toDateString()}`" />
  </v-container>
<PlacesLayer v-if="readyForPlaceView" @person-selected="switchToPersonView" @place-pre-selection-cleared="clearPreSelectionPlace" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue" :placesSelectedFromTrace="placesSelectedFromTrace"/>
<PersonsLayer v-if="readyForPersonView" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue"/>
<PersonTraces v-if="readyForTraceView" @place-selected="switchToPlacesView" @person-pre-selection-cleared="clearPreSelectionPerson" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue" :personsSelectedFromPlace="personsSelectedFromPlace"/>
<DistantLayer v-if="readyForDistantView" :map="globalMap" :sliderValue="sliderValue" :dateSliderValue="dateSliderValue"/>

</template>


<style scoped>
#mapContainer {
width: 100vw;
height: 90%;

}
</style>