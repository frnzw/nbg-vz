<script setup>
  import { onMounted, ref, watch } from 'vue';
  import 'leaflet/dist/leaflet.css';
  import 'maplibre-gl/dist/maplibre-gl.css';

  import L from 'leaflet';
  import '@maplibre/maplibre-gl-leaflet';

  // Import layer components
  import PlacesLayer from './PlacesLayer.vue';
  import PopulationLayer from './PopulationLayer.vue';
  import TimeSlider from './TimeSlider.vue';
  import DistantLayer from './DistantLayer.vue';
  import PersonTraces from './TracesLayer.vue';

  // Import Vue Router and helpers
  import { useRoute, useRouter } from 'vue-router';
  import { createInfobox } from '../mapHelpers';
  import { useMapStore } from '../stores/mapStore';

  // --- Store, Router, and Emit Setup ---

  /**
   * @type {import('pinia').Store}
   * The Pinia store for map configuration.
   */
  const mapStore = useMapStore();

  /**
   * @type {import('vue-router').RouteLocationNormalizedLoaded}
   * The current route object, used to determine which layer to show.
   */
  const route = useRoute();

  /**
   * @type {import('vue-router').Router}
   * The Vue router instance, used for programmatic navigation.
   */
  const router = useRouter();

  // --- Reactive State ---

  /**
   * @type {import('vue').Ref<number>}
   * The reactive timestamp value from the TimeSlider.
   * This is the "single source of truth" for the current date
   * and is passed as a prop to all layer components.
   */
  const dateSliderValue = ref(new Date('1827-12-31').getTime());

  /**
   * @type {import('vue').Ref<boolean>}
   * A flag to prevent rendering child components until the map is initialized.
   */
  // reactive switch for checking if props.map is initialized before rendering child components
  // set this in onMounted()
  let mapReady = ref(false);

  /**
   * @type {L.Map | undefined}
   * Holds the global Leaflet map instance.
   */
  let globalMap = undefined;

  /**
   * @type {L.Control | undefined}
   * Holds the global Leaflet infobox control instance.
   */
  let globalInfoBox = undefined;

  // --- Child Component Flags (for v-if) ---
  // These are controlled by the router.

  /**
   * @type {import('vue').Ref<boolean>}
   * Controls the rendering of the PlacesLayer component.
   */
  let readyForPlaceView = ref(false);
  /**
   * @type {import('vue').Ref<boolean>}
   * Controls the rendering of the PopulationLayer component.
   */
  let readyForPopulationView = ref(false);
  /**
   * @type {import('vue').Ref<boolean>}
   * Controls the rendering of the PersonTraces component.
   */
  let readyForTraceView = ref(false);
  /**
   * @type {import('vue').Ref<boolean>}
   * Controls the rendering of the DistantLayer component.
   */
  let readyForDistantView = ref(false);

  // --- Cross-Component Props State ---

  /**
   * @type {import('vue').Ref<Array<String>>}
   * Used to pass a pre-selected person ID from PlacesLayer to PersonTraces.
   */
  const personsSelectedFromPlace = ref([]);

  /**
   * @type {import('vue').Ref<Array<String>>}
   * Used to pass a pre-selected place ID from PersonTraces to PlacesLayer.
   */
  const placesSelectedFromTrace = ref([]);

  // --- Map Initialization ---

  /**
   * @type {string}
   * The URL for the Stadia Maps style.
   */
  let stadiaStyleUrl = mapStore.stadiaStyleUrl;

  /**
   * Initializes the Leaflet map, adds the MapLibre GL vector layer,
   * and creates the infobox control.
   * Sets `globalMap`, `globalInfoBox`, and `mapReady`.
   */
  const initMap = function () {
    const map = L.map('mapContainer').fitWorld().zoomIn();

    if (import.meta.env.DEV) {
      // local development requires stadia API key to avoid suspension when hitting tile rate limits
      stadiaStyleUrl = `${stadiaStyleUrl}?api_key=${mapStore.localApiKey}`;
    } else {
      // deployment uses domain name authentication
    }

    // Initialize the MapLibre GL layer
    const vectorLayer = L.maplibreGL({
      style: stadiaStyleUrl,
    });

    vectorLayer.addTo(map);

    // add infobox (without any content at this point)
    const info = createInfobox();
    info.addTo(map);

    // set vue variables to hand down as props
    globalMap = map;
    globalInfoBox = info;

    // Signal that the map is ready for child components
    mapReady.value = true;
  };

  /**
   * On component mount, initialize the map and set up the layer rendering logic.
   */
  onMounted(() => {
    initMap();
    prepareRenderingOfSubComponents();
  });

  // --- Cross-Component Navigation Handlers ---

  /**
   * Handles the 'person-selected' event from a child layer.
   * Stores the person ID and navigates to the 'traces' view.
   * @param {string} persId - The person ID to pre-select.
   */
  const switchToPersonView = function (persId) {
    personsSelectedFromPlace.value = [persId];
    router.push({ name: 'traces' });
  };

  /**
   * Handles the 'person-pre-selection-cleared' event.
   * Clears the pre-selected person ID.
   */
  const clearPreSelectionPerson = function () {
    personsSelectedFromPlace.value = [];
  };

  /**
   * Handles the 'place-selected' event from a child layer.
   * Stores the station ID and navigates to the 'places' view.
   * @param {string} stationId - The station ID to pre-select.
   */
  const switchToPlacesView = function (stationId) {
    placesSelectedFromTrace.value = [stationId];
    router.push({ name: 'places' });
  };

  /**
   * Handles the 'place-pre-selection-cleared' event.
   * Clears the pre-selected station ID.
   */
  const clearPreSelectionPlace = function () {
    placesSelectedFromTrace.value = [];
  };

  // --- Routing Logic ---

  /**
   * Reads the current route path and sets the appropriate
   * `readyFor...` ref to true, ensuring only one layer component
   * is rendered at a time.
   */
  const prepareRenderingOfSubComponents = function () {
    if (mapReady.value) {
      // Reset all layer flags
      readyForPlaceView.value = false;
      readyForPopulationView.value = false;
      readyForTraceView.value = false;
      readyForDistantView.value = false;

      // Set the flag for the *current* route
      if (route.path === '/map/places') {
        readyForPlaceView.value = true;
      } else if (route.path === '/map/population') {
        readyForPopulationView.value = true;
      } else if (route.path === '/map/traces') {
        readyForTraceView.value = true;
      } else if (route.path === '/map/distant') {
        readyForDistantView.value = true;
      } else {
        console.warn(
          'map component initialized without proper sub route, no additional layers will be visible!'
        );
      }
    }
  };

  /**
   * Watches the `route` object. When the route changes,
   * it re-runs the logic to switch the visible layer component.
   */
  watch(route, () => {
    prepareRenderingOfSubComponents();
  });
</script>

<template>
  <!-- The div where the Leaflet map is mounted -->
  <div id="mapContainer"></div>
  <v-container>
    <!-- The shared time slider, bound to the local dateSliderValue -->
    <TimeSlider v-model="dateSliderValue" class="pt-4" />
  </v-container>

  <!-- Conditionally rendered layer components -->
  <!-- Only one of these will be active at a time based on the route -->

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
