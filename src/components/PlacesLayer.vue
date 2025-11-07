<script setup>
  import L from 'leaflet';
  import { usePlacesStore } from '../stores/placesStore';
  import { useMapStore } from '../stores/mapStore';
  import {
    createCircleMarker,
    createPersonViewLinkAndIcon,
    createWikidataLinkAndIcon,
    getLastRecordBeforeSelectedDate,
    filterMarkersByDataKey,
    showLayer,
    hideLayer,
  } from '../mapHelpers.js';
  import { onMounted, ref, defineProps, onUnmounted, watch } from 'vue';
  import SearchField from './SearchField.vue';

  // --- Constants for Infobox ---

  /**
   * @type {string}
   * The headline to display in the infobox when this layer is active.
   */
  const infoHeadline = 'Ort: Personal';

  /**
   * @type {string}
   * The descriptive HTML content for the infobox.
   */
  const infoText = `
  Die Größe der Kreismarker beschreibt die <b>Anzahl der Personen</b>, die laut letztem erfassten Verzeichnis aus den NBG an der jeweiligen Missionsstation anwesend waren. Bei Lücken in den erfassten Daten werden also die <b>letzten erfassten Werte</b> angezeigt.
  <br> Vor und nach dem Datum des letzten erfassten NBG-Verzeichnisses werden keine Daten angezeigt.
  <br> Ein Klick auf die Marker zeigt eine Liste der anwesenden Personen und erlaubt, mit Vorauswahl einer Person in die Ansicht "Traces" zu wechseln.
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
    /**
     * An array of station IDs pre-selected from another view (e.g., Traces).
     * @type {Array<String>}
     */
    placesSelectedFromTrace: Array,
  });

  // --- Emits ---

  /**
   * Defines the component's emitted events.
   * @event person-selected
   * Emits when a person's ID is clicked in a popup, to switch to the person view.
   * @event place-pre-selection-cleared
   * Emits when the user interacts with the filter, to clear the one-time pre-selection.
   */
  const emit = defineEmits(['person-selected', 'place-pre-selection-cleared']);

  // --- Layer and Marker State ---

  /**
   * @type {Array<L.CircleMarker> | undefined}
   * Holds the complete, unfiltered array of all markers created for this layer.
   */
  let currentPlaceMarkers = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group that contains the *filtered* markers currently on the map.
   */
  let placeLayer = undefined;

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
   * It is initialized with the `placesSelectedFromTrace` prop.
   */
  const selectedValues = ref(props.placesSelectedFromTrace);

  // --- Marker Creation ---

  /**
   * Creates the popup and tooltip content for a given station marker.
   * @param {L.CircleMarker} circle - The Leaflet marker to bind to.
   * @param {object} station - The station data object from the store.
   * @param {number} lastRecordedDate - The timestamp of the data being displayed.
   * @param {object} lastPersonsBeforeSelectedTime - The personnel data object for that date.
   */
  const createPopUpAndTooltip = function (
    circle,
    station,
    lastRecordedDate,
    lastPersonsBeforeSelectedTime
  ) {
    // Base HTML for the popup
    let popUpHtml =
      `<h3>${station.stationId}</h3></br>` +
      `<b>Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):</b></br>`;

    // Create a container div
    const popupDiv = document.createElement('div');
    popupDiv.innerHTML = popUpHtml;

    // Add a "View Person" link for each person present
    if (lastPersonsBeforeSelectedTime) {
      for (const [
        index,
        person,
      ] of lastPersonsBeforeSelectedTime.persons.entries()) {
        const [button, icon] = createPersonViewLinkAndIcon(person.persId, emit);
        popupDiv.appendChild(button);
        popupDiv.appendChild(icon);
        // Add a line break unless it's the last person
        if (index < lastPersonsBeforeSelectedTime.persons.length - 1)
          popupDiv.appendChild(document.createElement('br'));
      }
    }

    // Add station metadata
    const subHeadingPlace = document.createElement('b');
    subHeadingPlace.textContent = 'Zum Ort:';
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subHeadingPlace);
    popupDiv.appendChild(document.createElement('br'));

    if (station.altName) {
      popupDiv.appendChild(
        document.createTextNode(`Alt.-Name: ${station.altName}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (station.yFounded) {
      popupDiv.appendChild(
        document.createTextNode(`Gegründet: ${station.yFounded}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (station.yRenewed) {
      popupDiv.appendChild(
        document.createTextNode(`Erneuert: ${station.yRenewed}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (station.region) {
      popupDiv.appendChild(
        document.createTextNode(`Region: ${station.region}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (station.wdId) {
      const [a, icon] = createWikidataLinkAndIcon(station.wdId);
      popupDiv.appendChild(document.createTextNode('Wikidata: '));
      popupDiv.appendChild(a);
      popupDiv.appendChild(icon);
      popupDiv.appendChild(document.createElement('br'));
    }

    // Bind the generated DOM element to the marker
    circle.bindPopup(popupDiv);
    circle.bindTooltip(`${station.stationId}`);
  };

  /**
   * Creates all station markers for the currently selected date.
   * This function generates new markers, filters them, and adds them to the map.
   * @param {object} stations - The `stations` object from the `placesStore`.
   */
  const createStationMarkersDate = function (stations) {
    const placeMarkers = [];

    // Iterate over all stations in the store
    for (const key of Object.keys(stations)) {
      if (!key) continue;
      if (stations.hasOwnProperty(key)) {
        const station = stations[key];

        // Get the most recent personnel data for this station *before* the slider date
        const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
          getLastRecordBeforeSelectedDate(
            station,
            props.dateSliderValue,
            'sortedDates', // Key for sorted date array
            'personsAggregatedDate' // Key for time-based data
          );

        // Only create a marker if data exists for this time
        if (lastPersonsBeforeSelectedTime) {
          const circle = createCircleMarker(
            station,
            lastPersonsBeforeSelectedTime.count,
            placesStore.minPersonnelCountAllStations,
            'red', // color
            true, // fill
            true, // stroke
            mapStore.markerBaseSizePersonnel, // base radius
            null // scaleToZoom
          );
          createPopUpAndTooltip(
            circle,
            station,
            lastRecordedDate,
            lastPersonsBeforeSelectedTime
          );
          placeMarkers.push(circle);
        }
      }
    }

    // Filter the newly created markers based on the SearchField selection
    const filteredByNamesPlaces = filterMarkersByDataKey(
      selectedValues.value,
      placeMarkers,
      'stationId'
    );
    // Create a new layer group with the filtered markers
    placeLayer = L.layerGroup(filteredByNamesPlaces);
    // Store the *unfiltered* list for later filtering
    currentPlaceMarkers = placeMarkers;
    // Add the filtered layer to the map
    placeLayer.addTo(props.map);
  };

  // --- Watchers ---

  /**
   * Watches the `dateSliderValue` prop for changes.
   * When it changes, it clears all existing markers and re-creates them
   * for the new date, then adds the new layer.
   */
  watch(
    () => props.dateSliderValue,
    () => {
      // Only run if the markers have been initialized
      if (currentPlaceMarkers && placeLayer) {
        if (placeLayer) placeLayer.clearLayers();

        // Re-run the full marker creation process
        createStationMarkersDate(placesStore.stations, props.map);
        showLayer(placeLayer, props.map);
      }
    }
  );

  // --- Event Handlers ---

  /**
   * Handles the `update:modelValue` event from the `SearchField` component.
   * @param {Array<String>} selectedValues - The new array of selected station IDs.
   * @param {Array<L.CircleMarker>} markers - The full list of *all* markers.
   */
  const onSelectedNamesUpdate = function (selectedValues, markers) {
    // clear pre-selection prop in map component to avoid pre-selection being active next time
    // a user navigates here via tabs
    emit('place-pre-selection-cleared');

    if (markers && placeLayer) {
      // !!! selectedValues comes from template here, can access directly not via .value
      placeLayer.clearLayers();

      // Filter the *master* marker list based on the new selection
      const filteredByStationId =
        selectedValues.length == 0
          ? markers // If empty, show all markers
          : filterMarkersByDataKey(selectedValues, markers, 'stationId');

      // Add the filtered markers back to the layer group
      filteredByStationId.forEach((marker) => marker.addTo(placeLayer));
    }
  };

  // --- Lifecycle Hooks ---

  /**
   * On component mount:
   * 1. Loads data from the `placesStore` if not already loaded.
   * 2. Updates the infobox with content for this layer.
   * 3. Creates the initial set of station markers.
   * 4. Populates the `nameList` for the `SearchField`.
   * 5. Adds the marker layer to the map.
   */
  onMounted(async () => {
    // 1. Load data if needed
    if (!placesStore.loaded) {
      await placesStore.readData(
        placesStore.pathToDataFilePlaces,
        placesStore.pathToDataFilePersonsPlaces,
        placesStore.pathToDataFilePopulationPlaces
      );
    }

    // 2. Update infobox
    props.infobox.update({ headline: infoHeadline, content: infoText });

    // 3. Create initial markers (if not already created)
    if (currentPlaceMarkers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);

    // 4. Populate search field data
    nameList.value = Array.from(Object.keys(placesStore.stations));

    // 5. Add layer to map
    showLayer(placeLayer, props.map);
  });

  /**
   * On component unmount:
   * 1. Hides the marker layer from the map to clean up.
   */
  onUnmounted(() => {
    hideLayer(placeLayer, props.map);
  });
</script>
<template>
  <v-container>
    <!-- The filter/search component for this layer -->
    <SearchField
      v-model="selectedValues"
      @update:modelValue="
        onSelectedNamesUpdate(selectedValues, currentPlaceMarkers)
      "
      :v-if="nameList.length > 0"
      :facet="facetName"
      :facetData="nameList"
    />
  </v-container>
</template>
