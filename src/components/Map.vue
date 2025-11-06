<script setup>
  import { onMounted, ref, watch } from 'vue';
  import 'leaflet/dist/leaflet.css';
  import 'maplibre-gl/dist/maplibre-gl.css';

  import L from 'leaflet';
  import '@maplibre/maplibre-gl-leaflet';

  import PlacesLayer from './PlacesLayer.vue';
  import PopulationLayer from './PopulationLayer.vue';
  import TimeSlider from './TimeSlider.vue';
  import DistantLayer from './DistantLayer.vue';
  import PersonTraces from './TracesLayer.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { createInfobox } from '../mapHelpers';
  import { useMapStore } from '../stores/mapStore';

  const mapStore = useMapStore();
  const route = useRoute();
  const router = useRouter();

  const emit = defineEmits(['mapIsReady']); // for passing map to parent component

  const dateSliderValue = ref(new Date('1827-12-31').getTime());

  // reactive switch for checking if props.map is initialized before rendering child components
  // set this in onMounted()
  let mapReady = ref(false);
  let globalMap = undefined;
  let globalInfoBox = undefined;

  // reactive switch for checking if current route is properly accessible before conditionally rendering child components
  // set this in onMounted()
  let readyForPlaceView = ref(false);
  let readyForPopulationView = ref(false);
  let readyForTraceView = ref(false);
  let readyForDistantView = ref(false);

  const personsSelectedFromPlace = ref([]);
  const placesSelectedFromTrace = ref([]);

  let stadiaStyleUrl = mapStore.stadiaStyleUrl;
  const initMap = function () {
    const map = L.map('mapContainer').fitWorld().zoomIn();

    if (mapStore.localApiKey) {
      // WENN wir lokal sind (weil der Key gefunden wurde):
      // Hänge den Key an die URL an.
      stadiaStyleUrl = `${stadiaStyleUrl}?api_key=${mapStore.localApiKey}`;
      console.log('Lokale Entwicklung: Verwende API-Key-Authentifizierung.');
    } else {
      // WENN wir in Produktion sind (Key nicht gefunden):
      // Verwende die Basis-URL (Domain-Authentifizierung greift).
      console.log('Produktion: Verwende Domain-Authentifizierung.');
    }

    const vectorLayer = L.maplibreGL({
      style: stadiaStyleUrl,
    }).addTo(map);

    // // carto db tile layer example
    // const tileLayer = L.tileLayer(
    //   'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' +
    //     (L.Browser.retina ? '@2x.png' : '.png'),
    //   {
    //     attribution:
    //       'Map tiles by <a href="https://carto.com/attributions">CARTO</a>, under CC BY 3.0. Data by <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    //     subdomains: 'abcd',
    //     maxZoom: 20,
    //     minZoom: 2,
    //   }
    // );

    // // add tile layer
    // tileLayer.addTo(map);

    // add infobox (without any content at this point)
    const info = createInfobox();
    info.addTo(map);

    // set vue variables to hand down as props
    globalMap = map;
    globalInfoBox = info;

    mapReady = true;
  };

  onMounted(() => {
    initMap();

    prepareRenderingOfSubComponents();
  });

  const switchToPersonView = function (persId) {
    personsSelectedFromPlace.value = [persId];
    router.push({ name: 'traces' });
  };

  const clearPreSelectionPerson = function () {
    personsSelectedFromPlace.value = [];
  };

  const switchToPlacesView = function (stationId) {
    placesSelectedFromTrace.value = [stationId];
    router.push({ name: 'places' });
  };

  const clearPreSelectionPlace = function () {
    placesSelectedFromTrace.value = [];
  };

  const prepareRenderingOfSubComponents = function () {
    if (mapReady) {
      if (route.path === '/map/places') {
        readyForPlaceView.value = true;

        readyForPopulationView.value = false;
        readyForTraceView.value = false;
        readyForDistantView.value = false;
      } else if (route.path === '/map/population') {
        readyForPopulationView.value = true;

        readyForTraceView.value = false;
        readyForPlaceView.value = false;
        readyForDistantView.value = false;
      } else if (route.path === '/map/traces') {
        readyForTraceView.value = true;

        readyForPlaceView.value = false;
        readyForPopulationView.value = false;
        readyForDistantView.value = false;
      } else if (route.path === '/map/distant') {
        readyForDistantView.value = true;

        readyForTraceView.value = false;
        readyForPlaceView.value = false;
        readyForPopulationView.value = false;
      } else {
        console.warn(
          'map component initialized without proper sub route, no additional layers will be visible!'
        );
      }
    }
  };

  watch(route, () => {
    prepareRenderingOfSubComponents();
  });
</script>

<template>
  <div id="mapContainer"></div>
  <v-container>
    <TimeSlider v-model="dateSliderValue" class="pt-4" />
  </v-container>
  <PlacesLayer
    v-if="readyForPlaceView"
    @person-selected="switchToPersonView"
    @place-pre-selection-cleared="clearPreSelectionPlace"
    :map="globalMap"
    :infobox="globalInfoBox"
    :dateSliderValue="dateSliderValue"
    :placesSelectedFromTrace="placesSelectedFromTrace"
  />
  <PopulationLayer
    v-if="readyForPopulationView"
    :map="globalMap"
    :infobox="globalInfoBox"
    :dateSliderValue="dateSliderValue"
  />
  <PersonTraces
    v-if="readyForTraceView"
    @place-selected="switchToPlacesView"
    @person-pre-selection-cleared="clearPreSelectionPerson"
    :map="globalMap"
    :infobox="globalInfoBox"
    :dateSliderValue="dateSliderValue"
    :personsSelectedFromPlace="personsSelectedFromPlace"
  />
  <DistantLayer
    v-if="readyForDistantView"
    @person-selected="switchToPersonView"
    @place-selected="switchToPlacesView"
    :map="globalMap"
    :infobox="globalInfoBox"
    :dateSliderValue="dateSliderValue"
  />
</template>

<style scoped>
  #mapContainer {
    width: 100vw;
    height: 90%;
  }
</style>
