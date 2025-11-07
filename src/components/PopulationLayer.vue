<script setup>
  import L from 'leaflet';
  import { useMapStore } from '../stores/mapStore.js';
  import { usePlacesStore } from '../stores/placesStore.js';
  import {
    createCircleMarker,
    filterMarkersByDataKey,
    showLayer,
    hideLayer,
    getLastRecordBeforeSelectedDate,
  } from '../mapHelpers.js';
  import { onMounted, ref, defineProps, onUnmounted, watch } from 'vue';
  import SearchField from './SearchField.vue';

  // --- Constants for Infobox ---

  /**
   * @type {string}
   * The headline to display in the infobox when this layer is active.
   */
  const infoHeadline = 'Ort: Gemeinde';

  /**
   * @type {string}
   * The descriptive HTML content for the infobox.
   */
  const infoText = `
  Diese Ansicht zeigt zwei Zahlen zur Größe der Gemeinden an den Missionsstationen, die im Rahmen des Forschungsnetzwerkes MKN aus den Missionsatlanten der Brüdergemeine erhoben wurden.  <br><br>
  Die Größe der roten Kreismarker kodiert die gesamte Anzahl der im Umfeld des Missionsortes wohnhaften Personen, inklusive jener, die nicht Gemeindemitglieder waren.  <br><br>
  Die Größe der blauen Ringe beschreibt die Anzahl der Personen , die ‘volle’ Gemeindemitglieder am jeweiligen Missionsort waren.  <br><br>
  Der Zeitpunkt der Erfassung ist (mangels Kenntnis des tatsächlichen Datums) wie für die Verzeichnisdaten auf den 31.12. festgelegt worden.
  Nicht für alle Jahre sind beide Zahlen vorhanden.
  <br>
  <br>
  Vor und nach dem Datum des letzten erfassten NBG-Verzeichnisses werden keine Daten angezeigt.
  <br> Ein Klick auf die Marker zeigt die genauen Zahlen.
  `;

  // --- Store Setup ---

  /**
   * @type {import('pinia').Store}
   * The Pinia store for place/station data.
   */
  const placesStore = usePlacesStore();
  /**
   * @type {import('pinia').Store}
   * The Pinia store for map configuration.
   */
  const mapStore = useMapStore();

  // --- Props ---

  /**
   * Defines the component's props.
   */
  const props = defineProps({
    /**
     * The main Leaflet map instance.
     * @type {L.Map}
     */
    map: Object,
    /**
     * The Leaflet infobox control instance.
     * @type {L.Control}
     */
    infobox: Object,
    /**
     * The currently selected timestamp from the timeline slider.
     * @type {Number}
     */
    dateSliderValue: Number,
  });

  // --- Emits ---

  /**
   * Defines the component's emitted events.
   * @event person-selected
   * Emits when a person's ID is clicked in a popup (not used in this component atm, but for future reference).
   * @event place-pre-selection-cleared
   * Emits when the user interacts with the filter, to clear the one-time pre-selection (not used in this component atm, but for future reference).
   */
  const emit = defineEmits(['person-selected', 'place-pre-selection-cleared']);

  // --- Layer and Marker State ---

  /**
   * @type {Array<L.CircleMarker> | undefined}
   * Holds the complete, unfiltered array of all markers for population type 1 (full members -> blue rings).
   */
  let currentPop1Markers = undefined;

  /**
   * @type {Array<L.CircleMarker> | undefined}
   * Holds the complete, unfiltered array of all markers for population type 2 (residents -> red circles).
   */
  let currentPop2Markers = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group that contains the *filtered* markers for pop type 1 (full members).
   */
  let popLayer1 = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group that contains the *filtered* markers for pop type 2 (residents).
   */
  let popLayer2 = undefined;

  // --- Facet Filter State ---

  /**
   * @type {string}
   * The label for the search/filter component.
   */
  const facetName = 'Stationsnamen';

  /**
   * @type {import('vue').Ref<Array<String>>}
   * A reactive list of all available station names, used to populate the `SearchField`.
   */
  let nameList = ref([]);

  /**
   * @type {import('vue').Ref<Array<String>>}
   * The reactive array of currently selected station names from the `SearchField`.
   */
  const selectedValues = ref([]);

  // --- Marker Creation ---

  /**
   * Creates the popup and tooltip content for a given population marker.
   * @param {L.CircleMarker} circle - The Leaflet marker to bind to.
   * @param {object} station - The station data object from the store.
   * @param {number} lastRecordedDatePop - The timestamp of the data being displayed.
   * @param {object} lastPopBeforeSelectedTime - The population data object for that date ({ pop_1, pop_2 }).
   */
  const createPopUpAndTooltip = function (
    circle,
    station,
    lastRecordedDatePop,
    lastPopBeforeSelectedTime
  ) {
    let popUpHtml =
      `<h3>${station.stationId}</h3></br>` +
      `<b>Anwesend in letztem erfassten Jahr ${lastRecordedDatePop ? new Date(lastRecordedDatePop).getFullYear() : ''}:</b></br>`;

    const popupDiv = document.createElement('div');
    popupDiv.innerHTML = popUpHtml;

    if (!lastRecordedDatePop)
      popupDiv.appendChild(document.createTextNode('Keine Daten.'));

    // Add Pop 1 (full members) data
    const subHeadingPop1 = document.createElement('b');
    subHeadingPop1.textContent = 'Mitglieder: ';
    popupDiv.appendChild(subHeadingPop1);
    if (lastPopBeforeSelectedTime.pop_1) {
      popupDiv.appendChild(
        document.createTextNode(`${lastPopBeforeSelectedTime.pop_1}`)
      );
    }
    popupDiv.appendChild(document.createElement('br'));

    // Add Pop 2 (residents) data
    const subHeadingPop2 = document.createElement('b');
    subHeadingPop2.textContent = 'Größe Gemeinde: ';
    popupDiv.appendChild(subHeadingPop2);
    if (lastPopBeforeSelectedTime.pop_2) {
      popupDiv.appendChild(
        document.createTextNode(`${lastPopBeforeSelectedTime.pop_2}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }

    circle.bindPopup(popupDiv);
    circle.bindTooltip(`${station.stationId}`);
  };

  /**
   * Creates all station markers (for both population types) for the currently selected date.
   * @param {object} stations - The `stations` object from the `placesStore`.
   */
  const createStationMarkersDate = function (stations) {
    const pop1Markers = [];
    const pop2Markers = [];

    // Iterate over all stations
    for (const key of Object.keys(stations)) {
      if (!key) continue;
      if (stations.hasOwnProperty(key)) {
        const station = stations[key];

        // Get the most recent population data for this station *before* the slider date
        const [lastRecordedDatePop, lastPopBeforeSelectedTime] =
          getLastRecordBeforeSelectedDate(
            station,
            props.dateSliderValue,
            'sortedDatesPop', // Key for sorted population dates
            'populationDate' // Key for population data map
          );

        // Only create markers if data exists for this time
        if (lastPopBeforeSelectedTime) {
          // --- Create Pop 1 Marker (full members -> blue ring) ---
          if (lastPopBeforeSelectedTime.pop_1) {
            // only create marker if data is present
            const circle = createCircleMarker(
              station,
              lastPopBeforeSelectedTime.pop_1,
              placesStore.minPopulationCountAllStations,
              'blue', // color
              false, // fill (ring)
              true, // stroke
              mapStore.markerBaseSizePopulation,
              props.map.getZoom()
            );
            createPopUpAndTooltip(
              circle,
              station,
              lastRecordedDatePop,
              lastPopBeforeSelectedTime
            );
            pop1Markers.push(circle);
          }

          // --- Create Pop 2 Marker (residents -> red circle) ---
          if (lastPopBeforeSelectedTime.pop_2) {
            // only create marker if data is present
            const circle = createCircleMarker(
              station,
              lastPopBeforeSelectedTime.pop_2,
              placesStore.minPopulationCountAllStations,
              'red', // color
              true, // fill (circle)
              false, // stroke
              mapStore.markerBaseSizePopulation,
              props.map.getZoom()
            );
            createPopUpAndTooltip(
              circle,
              station,
              lastRecordedDatePop,
              lastPopBeforeSelectedTime
            );
            pop2Markers.push(circle);
          }
        }
      }
    }

    // --- Filter and Add Pop 1 Layer (full members) ---
    const filteredByNamesPop1 = filterMarkersByDataKey(
      selectedValues.value,
      pop1Markers,
      'stationId'
    );
    popLayer1 = L.layerGroup(filteredByNamesPop1);
    currentPop1Markers = pop1Markers; // Store unfiltered list
    popLayer1.addTo(props.map);

    // --- Filter and Add Pop 2 Layer (residents) ---
    const filteredByNamesPop2 = filterMarkersByDataKey(
      selectedValues.value,
      pop2Markers,
      'stationId'
    );
    popLayer2 = L.layerGroup(filteredByNamesPop2);
    currentPop2Markers = pop2Markers; // Store unfiltered list
    popLayer2.addTo(props.map);
  };

  // --- Watchers ---

  /**
   * Watches the `dateSliderValue` prop for changes.
   * When it changes, it clears and recreates both population marker layers.
   */
  watch(
    () => props.dateSliderValue,
    () => {
      // Only run if layers are initialized
      if (currentPop1Markers && currentPop2Markers && popLayer1 && popLayer2) {
        // Clear existing layers
        if (popLayer1) popLayer1.clearLayers();
        if (popLayer2) popLayer2.clearLayers();

        // Re-run the full marker creation process
        createStationMarkersDate(placesStore.stations, props.map);

        // Add new layers to the map
        showLayer(popLayer1, props.map);
        showLayer(popLayer2, props.map);
      }
    }
  );

  // --- Event Handlers ---

  /**
   * Handles the `update:modelValue` event from the `SearchField` component.
   * Re-filters both population layers based on the new selection.
   * @param {Array<String>} selectedValues - The new array of selected station IDs.
   * @param {Array<L.CircleMarker>} pop1Markers - The full list of pop 1 markers (full members).
   * @param {Array<L.CircleMarker>} pop2Markers - The full list of pop 2 markers (residents).
   */
  const onSelectedNamesUpdate = function (
    selectedValues,
    pop1Markers,
    pop2Markers
  ) {
    // clear pre-selection prop (not used here, but good practice)
    emit('place-pre-selection-cleared');

    if (pop1Markers && pop2Markers && popLayer1 && popLayer2) {
      // Clear layers before re-filtering
      popLayer1.clearLayers();
      popLayer2.clearLayers();

      // --- Filter and Add Pop 1 Markers (full members) ---
      const filteredByNamesPop1 = filterMarkersByDataKey(
        selectedValues,
        pop1Markers,
        'stationId'
      );
      filteredByNamesPop1.forEach((marker) => marker.addTo(popLayer1));

      // --- Filter and Add Pop 2 Markers (residents) ---
      const filteredByNamesPop2 = filterMarkersByDataKey(
        selectedValues,
        pop2Markers,
        'stationId'
      );
      filteredByNamesPop2.forEach((marker) => marker.addTo(popLayer2));
    }
  };

  // --- Lifecycle Hooks ---

  /**
   * On component mount:
   * 1. Loads data from the `placesStore` (it's likely already loaded, but this ensures it).
   * 2. Updates the infobox with content for this layer.
   * 3. Creates the initial set of station markers for both pop types.
   * 4. Populates the `nameList` for the `SearchField`.
   * 5. Adds the marker layers to the map.
   */
  onMounted(async () => {
    // 1. Load data
    if (!placesStore.loaded) {
      await placesStore.readData(
        placesStore.pathToDataFilePlaces,
        placesStore.pathToDataFilePersonsPlaces,
        placesStore.pathToDataFilePopulationPlaces
      );
    }

    // 2. Update infobox
    props.infobox.update({ headline: infoHeadline, content: infoText });

    // 3. Create initial markers
    if (currentPop1Markers === undefined && currentPop2Markers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);

    // 4. Populate search field
    nameList.value = Array.from(Object.keys(placesStore.stations));

    // 5. Add layers to map
    showLayer(popLayer1, props.map);
    showLayer(popLayer2, props.map);
  });

  /**
   * On component unmount:
   * 1. Hides both population marker layers from the map to clean up.
   */
  onUnmounted(() => {
    hideLayer(popLayer1, props.map);
    hideLayer(popLayer2, props.map);
  });
  D;
</script>
<template>
  <v-container>
    <!-- The filter/search component for this layer -->
    <SearchField
      v-model="selectedValues"
      @update:modelValue="
        onSelectedNamesUpdate(
          selectedValues,
          currentPop1Markers,
          currentPop2Markers
        )
      "
      :v-if="nameList.length > 0"
      :facet="facetName"
      :facetData="nameList"
    />
  </v-container>
</template>
