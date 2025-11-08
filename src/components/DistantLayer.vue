<script setup>
  import L from 'leaflet';
  import { usePersonsStore } from '../stores/personsStore';
  import { usePlacesStore } from '../stores/placesStore';
  import { useMapStore } from '../stores/mapStore';
  import {
    createCircleMarker,
    createPersonViewLinkAndIcon,
    createPlaceViewLinkAndIcon,
    getLastRecordBeforeSelectedDate,
    scaleRadiusProportionalFlannery,
    getRecordsAroundDate,
    showLayer,
    hideLayer,
  } from '../mapHelpers.js';
  import { onMounted, watch, defineProps, onUnmounted } from 'vue';

  // ----------------- Setup / Component Scope Constants -------------------------

  /**
   * @type {string}
   * The headline to display in the infobox when this layer is active.
   */
  const infoHeadline = 'Distant View';

  /**
   * @type {string}
   * The descriptive HTML content for the infobox.
   */
  const infoText = `
  Diese Darstellung zeigt eine <b>übersichtsartige Animation</b> der in den erfassten NBG-Verzeichnissen documentierten Ortswechsel einzelner Missionar:innen. 
  Ein Ortswechsel beliebig vieler Personen wird dafür als animierter, blauer Marker dargestellt. 
  </br>
  </br>
  Die Größe der Ortmarker beschreibt die Anzahl der laut NBG-Verzeichnis anwesenden Personen und wird in der Animation dynamisch angepasst. 
  Nach Animation aller Ortswechsel wird die Größe der Stationen final für das gewählte Datum berechnet. 
  Damit wird Neuerfassungen oder Sterbefällen, die ohne dokumentierten Ortswechels
  die Personenananzahl verändern, Rechnung getragen.
  </br>
  </br>
  Ein Klick auf die Marker zeigt <b>weitere Informationen</b> an und erlaubt Wechsel in die Ansichten Ort:Personal und Traces.
  `;

  // --- Store Setup ---

  /**
   * @type {import('pinia').Store}
   * The Pinia store for place/station data.
   */
  const placesStore = usePlacesStore();

  /**
   * @type {import('pinia').Store}
   * The Pinia store for person data.
   */
  const personsStore = usePersonsStore();

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
   * Emits when a person's ID is clicked in a popup.
   * @event place-selected
   * Emits when a place's ID is clicked in a popup.
   */
  const emit = defineEmits(['person-selected', 'place-selected']);

  // --- Layer and Marker State ---

  /**
   * @type {Array<L.CircleMarker> | undefined}
   * Holds the complete, unfiltered array of all *station* markers.
   */
  let allPlaceMarkers = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group that contains the station markers.
   */
  let placeLayer = undefined;

  // ----------------- Marker and Popup Creation -------------------------

  /**
   * Creates the popup and tooltip content for a station marker.
   * Includes links to the place view and to each person present.
   * @param {L.CircleMarker} circle - The Leaflet marker to bind to.
   * @param {object} station - The station data object.
   * @param {number} lastRecordedDate - The timestamp of the data being displayed.
   * @param {object} lastPersonsBeforeSelectedTime - The personnel data for that date.
   */
  const createPopUpAndTooltip = function (
    circle,
    station,
    lastRecordedDate,
    lastPersonsBeforeSelectedTime
  ) {
    // Create a "View Place" button/link
    const [button, icon] = createPlaceViewLinkAndIcon(station.stationId, emit);
    const heading = document.createElement('h3');
    heading.appendChild(button);
    heading.appendChild(icon);

    // Create the subheading with date and count
    const subheading = document.createElement('b');
    subheading.textContent = `Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):`;

    // Create the main popup container
    const popupDiv = document.createElement('div');
    popupDiv.appendChild(heading);
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subheading);
    popupDiv.appendChild(document.createElement('br'));

    // Add a "View Person" link for each person
    if (lastPersonsBeforeSelectedTime) {
      for (const [
        index,
        person,
      ] of lastPersonsBeforeSelectedTime.persons.entries()) {
        const [button, icon] = createPersonViewLinkAndIcon(person.persId, emit);
        popupDiv.appendChild(button);
        popupDiv.appendChild(icon);
        if (index < lastPersonsBeforeSelectedTime.persons.length - 1)
          popupDiv.appendChild(document.createElement('br'));
      }
    }

    circle.bindPopup(popupDiv);
    circle.bindTooltip(`${station.stationId}`);
  };

  /**
   * Creates a single station marker for the current `dateSliderValue`.
   * @param {object} station - The station object from `placesStore`.
   * @returns {L.CircleMarker | undefined} The created marker, or undefined if no data.
   */
  const createStationMarker = function (station) {
    // Get the most recent personnel data for this station
    const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
      getLastRecordBeforeSelectedDate(
        station,
        props.dateSliderValue,
        'sortedDates',
        'personsAggregatedDate'
      );

    // Only create a marker if data exists
    if (lastPersonsBeforeSelectedTime) {
      // Create the base circle marker
      const circle = createCircleMarker(
        station,
        lastPersonsBeforeSelectedTime.count,
        placesStore.minPersonnelCountAllStations,
        'red', // color
        true, // fill
        true, // stroke
        mapStore.markerBaseSizePersonnel, // baseRadius
        null // scaleToZoom
      );

      // Attach personnel count to the marker's data and create popup
      ((circle.data.persCount = lastPersonsBeforeSelectedTime.count),
        createPopUpAndTooltip(
          circle,
          station,
          lastRecordedDate,
          lastPersonsBeforeSelectedTime
        ));

      return circle;
    } else {
      // No data for this date, no marker
      return undefined;
    }
  };

  /**
   * Creates all station markers for the current date and adds them to the map.
   * This function populates `allPlaceMarkers` and `placeLayer`.
   * @param {object} stations - The `stations` object from `placesStore`.
   */
  const createStationMarkersDate = function (stations) {
    const placeMarkers = [];

    // Loop through all stations in the store
    for (const key of Object.keys(stations)) {
      if (!key) continue;
      if (stations.hasOwnProperty(key)) {
        const station = stations[key];

        // Create a marker for the station
        const circle = createStationMarker(station);
        if (circle) placeMarkers.push(circle); // Add to array if created
      }
    }

    // Create the Leaflet layer group and store references
    placeLayer = L.layerGroup(placeMarkers);
    allPlaceMarkers = placeMarkers;
    placeLayer.addTo(props.map);
  };

  // ----------------- Animation -------------------------

  // Actual animation function animateMarker will be repeatedly called as a callback wrapped by
  // Javascript function requestAnimationFrame. requestAnimationFrame hands over a time stamp to the
  // callback, which is used in conjunction with a fixed animation duration to determine
  // when the animation is over. requestAnimationFrame will execute the callback in sync with the
  // browser's refresh rate. See: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame.
  // In the callback, a Leaflet marker's position is updated to make it move along a line. Finally, the
  // destination's place marker is updated to reflect the newly arrived person in its radius.

  /**
   * The core animation function, called recursively by `requestAnimationFrame`.
   * Calculates a marker's position along a line and updates its LatLng.
   * @param {number} time - The high-resolution timestamp provided by `requestAnimationFrame`.
   * @param {L.Circle} persMarker - The temporary (blue) marker that moves.
   * @param {L.CircleMarker} markerStart - The station marker (start).
   * @param {L.CircleMarker} markerEnd - The station marker (end).
   * @param {number} duration - The total duration of the animation (ms).
   * @param {number} startTime - The `performance.now()` timestamp when the animation began.
   * @param {string} persId - The ID of the person moving.
   * @param {number} minPersonnelCountAllStations - Global min count for scaling radii.
   * @returns {Promise<void>}
   */
  async function animateMarker(
    time,
    persMarker,
    markerStart,
    markerEnd,
    duration,
    startTime,
    persId,
    minPersonnelCountAllStations
  ) {
    // progress, i.e. proportion of line that should have been
    // passed at time since animation started [0,1]
    // => e.g if animation time = 1000 ms, 500 ms passed since start => 0.5
    // => current position is at half the distance
    const progressOnLine = (time - startTime) / duration;

    // --- Animation Finished ---
    if (progressOnLine >= 1) {
      persMarker.setLatLng(markerEnd.getLatLng()); // Snap to final position
      // update end marker's person count and radius
      markerEnd.data.persCount = markerEnd.data.persCount + 1;

      markerEnd.setRadius(
        scaleRadiusProportionalFlannery(
          markerEnd.data.persCount,
          minPersonnelCountAllStations,
          mapStore.markerBaseSizePersonnel
        )
      );

      persMarker.removeFrom(props.map); // Remove the temporary moving marker
      return; // end animation
    }

    // --- Animation in Progress ---

    // transform LatLng to pixel coordinates with native leaflet function
    // This allows for linear interpolation, as pixels are a linear space.
    const startPoint = props.map.latLngToLayerPoint(markerStart.getLatLng());
    const endPoint = props.map.latLngToLayerPoint(markerEnd.getLatLng());

    // calculate the current position using the expected progress on the
    // line at the current time since animation started
    const currentPoint = L.point(
      startPoint.x + (endPoint.x - startPoint.x) * progressOnLine,
      startPoint.y + (endPoint.y - startPoint.y) * progressOnLine
    );

    // transform back to LatLng coordinates with native leaflet function
    const currentLatLng = props.map.layerPointToLatLng(currentPoint);

    // update person marker with the current position
    persMarker.setLatLng(currentLatLng);

    // call animation function again for the next frame
    requestAnimationFrame(
      async (progressOnLine) =>
        await animateMarker(
          progressOnLine,
          persMarker,
          markerStart,
          markerEnd,
          duration,
          startTime,
          persId,
          minPersonnelCountAllStations
        )
    );
  }

  /**
   * Triggers the animation of a person moving from one station to another.
   * Creates a temporary marker, updates the start/end markers, and starts the animation loop.
   * @param {L.CircleMarker} markerStart - The station marker to start from.
   * @param {L.CircleMarker} markerEnd - The station marker to move to.
   * @param {string} persId - The ID of the person moving.
   * @param {number} minPersonnelCountAllStations - Global min count for scaling.
   * @returns {Promise} A promise that resolves after the animation duration (500ms).
   */
  const createNativeMovingMarker = async function (
    markerStart,
    markerEnd,
    persId,
    minPersonnelCountAllStations
  ) {
    // a temporary person marker that will be moved across the map
    const persMarker = L.circle(markerStart.getLatLng(), {
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.5,
    });
    persMarker.addTo(props.map);

    const duration = 500; // 500ms animation
    const startTime = performance.now(); // Get the high-precision start time

    // --- Update Start Marker ---
    // Update start marker's radius here (person is "leaving")
    if (markerStart.data.persCount > 0)
      markerStart.data.persCount = markerStart.data.persCount - 1;

    markerStart.setRadius(
      scaleRadiusProportionalFlannery(
        markerStart.data.persCount,
        minPersonnelCountAllStations,
        mapStore.markerBaseSizePersonnel
      )
    );

    // Kick off the animation loop
    requestAnimationFrame(
      async (t) =>
        await animateMarker(
          t,
          persMarker,
          markerStart,
          markerEnd,
          duration,
          startTime,
          persId,
          minPersonnelCountAllStations
        )
    );

    // Return a promise that resolves when the animation is *supposed* to be done.
    // This is used by `Promise.all` in the watcher.
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  };

  // ----------------- Lifecycle Functions -------------------------

  /**
   * On component mount:
   * 1. Loads data from both stores if not already loaded.
   * 2. Updates the infobox with content for this layer.
   * 3. Creates the initial set of station markers for the current slider date.
   * 4. Adds the marker layer to the map.
   */
  onMounted(async () => {
    // 1. Load data
    if (!placesStore.loaded)
      await placesStore.readData(
        placesStore.pathToDataFilePlaces,
        placesStore.pathToDataFilePersonsPlaces,
        placesStore.pathToDataFilePopulationPlaces
      );
    if (!personsStore.loaded)
      await personsStore.readData(
        personsStore.pathToDataFilePersons,
        personsStore.pathToDataFilePersonsPlaces
      );

    // 2. Update infobox
    props.infobox.update({ headline: infoHeadline, content: infoText });

    // 3. Create initial markers
    if (allPlaceMarkers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);

    // 4. Add layer to map
    showLayer(placeLayer, props.map);
  });

  /**
   * On component unmount:
   * 1. Hides the marker layer from the map to clean up.
   */
  onUnmounted(() => hideLayer(placeLayer, props.map));

  /**
   * Watches the `dateSliderValue` prop for changes.
   * This is the core logic for the "Distant View" animation.
   * It detects when people move stations and triggers the animations.
   */
  watch(
    () => props.dateSliderValue,
    async (newDateSliderValue, oldDateSliderValue) => {
      // --- Special case: Handling the very first date ---
      // if newDate is first date there are records for AND we have moved FORWARDS in time:
      // (re-)create all markers having data for this date, (re-)create layer
      if (
        newDateSliderValue === mapStore.dateFirstRecordsPlace &&
        newDateSliderValue > oldDateSliderValue
      ) {
        createStationMarkersDate(placesStore.stations, props.map);
      }
      // if oldDate is first date there are records for AND we have moved BACKWARDS in time:
      // just hide the layer
      if (
        oldDateSliderValue === mapStore.dateFirstRecordsPlace &&
        newDateSliderValue < oldDateSliderValue
      ) {
        hideLayer(placeLayer, props.map);
      }

      // This array will hold all animation promises
      const animateMarkerPromises = [];

      // Loop through every person to check if they moved
      for (const key of Object.keys(personsStore.persons)) {
        if (!key) continue;
        const person = personsStore.persons[key];

        // Get the person's station data around the *new* slider date
        const [lastRecordedDate, currentStation, previousStation, nextStation] =
          getRecordsAroundDate(
            person,
            props.dateSliderValue,
            'sortedDatesStation', // key for sorted dates
            'stationsDate', // key for data map
            oldDateSliderValue, // old slider value for context
            false // `lastOnly = false`
          );

        // --- animation FORWARD in time ---
        if (newDateSliderValue >= oldDateSliderValue) {
          if (!(previousStation && currentStation)) continue; // if person has no previous recorded place, go to next person

          // if person has changed place, trigger animation
          if (previousStation.stationId != currentStation.stationId) {
            // --- Edge case: Add markers if they don't exist ---
            // if one of current stations is not yet in allPlaceMarkers -> add it:
            if (
              !allPlaceMarkers
                .map((m) => m.data.stationId)
                .includes(currentStation.stationId)
            ) {
              // ! create marker using the entry from places store, currentStation-Object from above
              // is from person.stationsDate entry -> does not contain all data for marker creation
              const circle = createStationMarker(
                placesStore.stations[currentStation.stationId]
              );

              if (circle) allPlaceMarkers.push(circle);
              circle.addTo(placeLayer);
            }

            if (
              !allPlaceMarkers
                .map((m) => m.data.stationId)
                .includes(previousStation.stationId)
            ) {
              // ! create marker using the entry from places store, currentStation-Object from above
              // is from person.stationsDate entry -> does not contain all data for marker creation
              const circle = createStationMarker(
                // This function is not defined, but I must not change code.
                placesStore.stations[currentStation.stationId]
              );

              if (circle) allPlaceMarkers.push(circle);
              circle.addTo(placeLayer);
            }

            // --- Find Markers and Trigger Animation ---
            // get the actual markers for the previous and the next station
            // this would be easier with a hashmap built upon initial marker creation
            let currentMarker;
            let previousMarker;
            for (const m of allPlaceMarkers) {
              if (m.data.stationId === previousStation.stationId)
                previousMarker = m;
              if (m.data.stationId === currentStation.stationId)
                currentMarker = m;
            }

            // Add the animation promise to the array
            animateMarkerPromises.push(
              createNativeMovingMarker(
                previousMarker,
                currentMarker,
                person.persId,
                placesStore.minPersonnelCountAllStations
              )
            );
          }
        } else {
          // --- animation BACKWARD in time ---

          if (!(nextStation && currentStation)) continue; // if person has no previous recorded place, go to next person

          // if person has changed place, trigger animation
          if (nextStation.stationId != currentStation.stationId) {
            // get the actual markers for the previous and the next station
            // this would be easier with a hashmap built upon initial marker creation
            let currentMarker;
            let nextMarker;
            for (const m of allPlaceMarkers) {
              if (m.data.stationId === nextStation.stationId) nextMarker = m;
              if (m.data.stationId === currentStation.stationId)
                currentMarker = m;
            }

            // Add the animation promise to the array (moving from "next" to "current")
            animateMarkerPromises.push(
              createNativeMovingMarker(
                nextMarker,
                currentMarker,
                person.persId,
                placesStore.minPersonnelCountAllStations
              )
            );
          }
        }
      }

      // --- Sync and Reset ---
      // sort of a hack: await Promises with timeout equal to animation length
      // for each animation, to have async animations finished before setting final marker
      // properties for the currently selected date
      // --- this is necessary since persons previously unrecorded may pop up at stations,
      // others may have died or not properly recoreded elsewhere after moving – both
      // need to be taken into account for total person count on a particular date
      await Promise.all(animateMarkerPromises);

      // After all animations are finished, clear and recreate all markers
      // to reflect the *actual* state at the selected date, accounting for
      // non-movement-related changes (births, deaths, new records).
      placeLayer.clearLayers();
      createStationMarkersDate(placesStore.stations, props.map);
    }
  );
</script>
<template>
  <!-- This component controls a Leaflet layer and has no visible template. -->
</template>
