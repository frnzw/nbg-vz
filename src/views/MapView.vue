<script setup>
  import Map from '../components/Map.vue';

  // Import layer components
  import PlacesLayer from '../components/PlacesLayer.vue';
  import PopulationLayer from '../components/PopulationLayer.vue';
  import TimeSlider from '../components/TimeSlider.vue';
  import DistantLayer from '../components/DistantLayer.vue';
  import PersonTraces from '../components/TracesLayer.vue';

  import { onMounted, ref, watch } from 'vue';

  // Import Vue Router and helpers
  import { useRoute, useRouter } from 'vue-router';

  // --- Store, Router, and Emit Setup ---

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

  let globalMap = ref(undefined);
  let globalInfoBox = ref(undefined);
  let mapReady = ref(false); // This controls when to render layers

  /**
   * @type {import('vue').Ref<number>}
   * The reactive timestamp value from the TimeSlider.
   * This is the "single source of truth" for the current date
   * and is passed as a prop to all layer components.
   */
  const dateSliderValue = ref(new Date('1827-12-31').getTime());

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

  // --- Cross-Component Navigation Handlers ---

  const onMapReady = (map, infobox) => {
    globalMap.value = map;
    globalInfoBox.value = infobox;
    mapReady.value = true;
    // Now that the map is ready, we can run the router logic
    prepareRenderingOfSubComponents();
  };

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

  onMounted(() => {
    // If the map is already ready when this view mounts, run the logic.
    // (This also gets called by onMapReady for the initial load)
    if (mapReady.value) {
      prepareRenderingOfSubComponents();
    }
  });
</script>

<template>
  <!-- 
    The Map component renders the map div and emits 'map-ready'
    when the map object is initialized.
  -->
  <Map @map-ready="onMapReady" />

  <!-- The TimeSlider and all layer components live in this View component -->
  <v-container>
    <TimeSlider v-model="dateSliderValue" class="pt-4" />
  </v-container>

  <!-- 
    The layers are rendered here, and *critically* they wait for
    both the correct route (readyFor...) AND the map to be ready.
  -->
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
