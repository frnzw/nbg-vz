<script setup>
  import L from 'leaflet';
  import 'leaflet-polylinedecorator';
  import 'leaflet/dist/leaflet.css';
  import { useMapStore } from '../stores/mapStore.js';
  import {
    createWikidataLinkAndIcon,
    createPlaceViewLinkAndIcon,
    getLastRecordBeforeSelectedDate,
    showLayer,
    hideLayer,
    filterMarkersByDataKey,
  } from '../mapHelpers.js';
  import { usePersonsStore } from '../stores/personsStore.js';
  import { onMounted, onUnmounted, watch, ref, defineEmits } from 'vue';
  import SearchField from './SearchField.vue';

  // ------------------------------ SOME SHARED CONSTANTS

  /**
   * @type {string}
   * The headline to display in the infobox when this layer is active.
   */
  const infoHeadline = 'Person: Traces';

  /**
   * @type {string}
   * The descriptive HTML content for the infobox.
   */
  const infoText = `
Diese Darstellung zeigt die aus den NBG-Verzeichnissen erfassten Aufenthaltsorte einzelner Personen im zeitlichen Verlauf. 
Die Visualierung ist für die <b>Betrachtung ausgewählter Personen</b> konzipiert – das geht mittels des <b>Suchfeldes</b> unterhalb des Zeitsliders.
</br>
</br>
Der Personenmarker gibt den zu dem ausgewählten Datum zuletzt erfassten Aufenthaltsort der Person an. Rote Kreismarker symbolisieren 
die in der Vergangenheit besuchten Missionsstationen, Pfeile die Abfolge, in der die jeweilige Person an ihnen erfasst war. 
</br>
</br>
Wiederholt besuchte Marker und "gegangene Wege" werden entsprechend der Häufigkeit der Aufenthalte / Ortswechsel dunkler dargestellt.
  `;

  // --- Store Setup ---

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
    /**
     * An array of person IDs pre-selected from another view (e.g., Places).
     * @type {Array<String>}
     */
    personsSelectedFromPlace: Array,
  });

  // --- Emits ---

  /**
   * Defines the component's emitted events.
   * @event place-selected
   * Emits when a place's ID is clicked in a popup, to switch to the place view.
   * @event person-pre-selection-cleared
   * Emits when the user interacts with the filter, to clear the one-time pre-selection.
   */
  const emit = defineEmits(['place-selected', 'person-pre-selection-cleared']);

  // --- Layer and Marker State ---

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group for the main person markers (current location).
   */
  // global layer groups that will be updated, added to / removed from map on user interaction
  let personLayerMarkers = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group for the polylines/arrows (traces) between stations.
   */
  let personLayerTraces = undefined;

  /**
   * @type {L.LayerGroup | undefined}
   * The Leaflet layer group for the red circles (past locations).
   */
  let personLayerPlaces = undefined;

  // --- Facet Filter State ---

  /**
   * @type {string}
   * The label for the search/filter component.
   */
  const facetName = 'Personennamen';

  /**
   * @type {import('vue').Ref<Array<String>>}
   * A reactive list of all available person names (persId), used to populate the `SearchField`.
   */
  let nameList = ref([]);

  /**
   * @type {import('vue').Ref<Array<String>>}
   * The reactive array of currently selected person IDs from the `SearchField`.
   * It is initialized with the `personsSelectedFromPlace` prop.
   */
  const selectedValues = ref(props.personsSelectedFromPlace);

  // ------------------------------ MAIN FUNCTIONS FOR MARKER CREATION

  // some shared constants
  /**
   * @type {string}
   * CSS for the wrapper div of the custom trace marker.
   */
  const wrapperStyle = 'position: relative; width: 50px; height: 50px;';

  /**
   * @type {string}
   * CSS for the icon element of the custom trace marker.
   */
  const iconCss = 'font-size: 28px; position: absolute; top: 0px; left: 1px';

  /**
   * Creates a custom HTML/SVG marker for a person's current location.
   * @param {object} person - The person object (used for data).
   * @param {object} station - The station object (used for lat/long).
   * @param {number} opacity - The opacity for the marker.
   * @param {string} wrapperStyle - CSS string for the wrapper.
   * @param {string} iconCss - CSS string for the icon.
   * @returns {L.Marker} A Leaflet marker with a `L.divIcon`.
   */
  const createTraceMarker = function (
    person,
    station,
    opacity,
    wrapperStyle,
    iconCss
  ) {
    // SVG for the teardrop marker shape
    const markerSvg = `
                        <svg viewBox="0 0 30 50" width="30" height="50" style="display: block;">
                        <path d="M15 0
                                C32 0, 32 25, 15 50
                                C-2 25, -2 0, 15 0 Z"
                                fill="#F5F5F5" fill-opacity="${opacity}" stroke-opacity="${opacity}" stroke="black" stroke-width="1"/>
                        </svg>
                        `;
    // Add opacity to the icon's CSS
    const opaqueIconCss = iconCss + `; opacity: ${opacity};`;

    // Combine SVG and icon into one HTML string
    const html =
      `<div style="${wrapperStyle}">` +
      markerSvg +
      `<i class="mdi mdi-human-male" style="${opaqueIconCss}"></i>` +
      '</div>';

    // Create the L.divIcon
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: html,
      iconSize: [30, 42],
      iconAnchor: [15, 42], // Point of the teardrop
      html: html,
    });

    // Create the marker
    const marker = L.marker([station.lat, station.long], {
      icon: icon,
      title: station.stationId + person.persId,
    });
    // Attach data for filtering
    marker.data = { date: station.date, name: person.persId };

    return marker;
  };

  /**
   * Creates the complex popup and tooltip for the main person (trace) marker.
   * This popup includes details about the person, their current/prev/next stations,
   * and links to switch views.
   * @param {L.Marker} marker - The marker to bind the popup to.
   * @param {object} person - The person object.
   * @param {object} lastKnownChoir - The person's choir data for the selected date.
   * @param {number} lastRecordedDate - The timestamp of the choir data.
   * @param {object} prevStation - The station object for the *previous* stay.
   * @param {object} prevStationStay - The stay object for the *previous* stay.
   * @param {object} station - The station object for the *current* stay.
   * @param {object} stay - The stay object for the *current* stay.
   * @param {object} nextStation - The station object for the *next* stay.
   * @param {object} nextStationStay - The stay object for the *next* stay.
   */
  const createPopUpAndTooltipDate = function (
    marker,
    person,
    lastKnownChoir,
    lastRecordedDate,
    prevStation,
    prevStationStay,
    station,
    stay,
    nextStation,
    nextStationStay
  ) {
    // --- Get Date Ranges ---
    const stationDateFrom = station.stays[stay.stayIdx].dateFrom;
    const stationDateTo = station.stays[stay.stayIdx].dateTo;
    const datePresent =
      stationDateFrom === stationDateTo
        ? new Date(stationDateFrom).getFullYear()
        : // Format as "YYYY-YYYY"
          new Date(stationDateFrom).getFullYear() +
          '-' +
          new Date(stationDateTo).getFullYear();

    let datePresentNext,
      buttonNext,
      iconNext,
      datePresentPrev,
      buttonPrev,
      iconPrev;

    // Get details for the *next* station, if it exists
    if (nextStation) {
      const nextStationDateFrom =
        nextStation.stays[nextStationStay.stayIdx].dateFrom;
      const nextStationDateTo =
        nextStation.stays[nextStationStay.stayIdx].dateTo;
      datePresentNext =
        nextStationDateFrom === nextStationDateTo
          ? new Date(nextStationDateFrom).getFullYear()
          : new Date(nextStationDateFrom).getFullYear() +
            '-' +
            new Date(nextStationDateTo).getFullYear();
      // Create a "View Place" link
      [buttonNext, iconNext] = createPlaceViewLinkAndIcon(
        nextStation.stationId,
        emit
      );
    }

    // Get details for the *previous* station, if it exists
    if (prevStation) {
      const prevStationDateFrom =
        prevStation.stays[prevStationStay.stayIdx].dateFrom;
      const prevStationDateTo =
        prevStation.stays[prevStationStay.stayIdx].dateTo;
      datePresentPrev =
        prevStationDateFrom === prevStationDateTo
          ? new Date(prevStationDateFrom).getFullYear()
          : new Date(prevStationDateFrom).getFullYear() +
            '-' +
            new Date(prevStationDateTo).getFullYear();
      // Create a "View Place" link
      [buttonPrev, iconPrev] = createPlaceViewLinkAndIcon(
        prevStation.stationId,
        emit
      );
    }

    // --- Build Popup DOM ---
    const popupDiv = document.createElement('div');

    // --- Heading ---
    const heading = document.createElement('h3');
    heading.textContent = `${person.persId} ${lastRecordedDate ? '(' + lastKnownChoir.choir + ')' : ''} : ${marker.data.stationIdx} (${!datePresent ? 'keine Daten' : datePresent})`;

    // --- Current Station ---
    const subHeadingCurrent = document.createElement('b');
    subHeadingCurrent.textContent = 'Letzte (erfasste) Station aus NBG-VZ:';
    const [buttonCurrent, iconCurrent] = createPlaceViewLinkAndIcon(
      station.stationId,
      emit
    );

    // --- Previous Station ---
    const subHeadingPrev = document.createElement('b');
    subHeadingPrev.textContent = 'Vorherige (erfasste) Station aus NBG-VZ:';

    // --- Next Station ---
    const subHeadingNext = document.createElement('b');
    subHeadingNext.textContent = 'Nächste (erfasste) Station aus NBG-VZ:';

    // --- Append Station Info ---
    popupDiv.appendChild(heading);
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subHeadingCurrent);
    popupDiv.appendChild(document.createElement('br'));
    if (datePresent) {
      popupDiv.appendChild(document.createTextNode(`${datePresent}: `));
      popupDiv.appendChild(buttonCurrent);
      popupDiv.appendChild(iconCurrent);
    } else {
      popupDiv.appendChild(document.createTextNode('keine Daten'));
    }
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subHeadingPrev);
    popupDiv.appendChild(document.createElement('br'));
    if (datePresentPrev) {
      popupDiv.appendChild(document.createTextNode(`${datePresentPrev}: `));
      popupDiv.appendChild(buttonPrev);
      popupDiv.appendChild(iconPrev);
    } else {
      popupDiv.appendChild(document.createTextNode('keine Daten'));
    }
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subHeadingNext);
    popupDiv.appendChild(document.createElement('br'));
    if (datePresentNext) {
      popupDiv.appendChild(document.createTextNode(`${datePresentNext}: `));
      popupDiv.appendChild(buttonNext);
      popupDiv.appendChild(iconNext);
    } else {
      popupDiv.appendChild(document.createTextNode('keine Daten'));
    }

    // --- Person Details ---
    const subHeadingPerson = document.createElement('b');
    subHeadingPerson.textContent = 'Zur Person:';

    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subHeadingPerson);
    popupDiv.appendChild(document.createElement('br'));
    if (person.familyName) {
      popupDiv.appendChild(
        document.createTextNode(`Nachname: ${person.familyName}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (person.givenName) {
      popupDiv.appendChild(
        document.createTextNode(`Vorname: ${person.givenName}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (person.gender) {
      popupDiv.appendChild(document.createTextNode(`Gender: ${person.gender}`));
      popupDiv.appendChild(document.createElement('br'));
    }
    if (person.birthName) {
      popupDiv.appendChild(
        document.createTextNode(`geboren: ${person.birthName}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (person.widowed) {
      popupDiv.appendChild(
        document.createTextNode(`verwitwet: ${person.widowed}`)
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (lastRecordedDate) {
      popupDiv.appendChild(
        document.createTextNode(
          `Chor: ${lastKnownChoir.choir} (${new Date(lastRecordedDate).getFullYear()})`
        )
      );
      popupDiv.appendChild(document.createElement('br'));
    }
    if (person.wdId) {
      const [a, icon] = createWikidataLinkAndIcon(person.wdId);
      popupDiv.appendChild(document.createTextNode('Wikidata: '));
      popupDiv.appendChild(a);
      popupDiv.appendChild(icon);
      popupDiv.appendChild(document.createElement('br'));
    }

    // Bind the final popup and tooltip
    marker.bindPopup(popupDiv);
    marker.bindTooltip(`${person.persId}`);
  };

  /**
   * Creates all markers and traces for a single person.
   * Mutates the `markers`, `traces`, and `places` arrays passed as arguments.
   * @param {Array<object>} orderedStationsAggr - The person's chronological list of stays.
   * @param {Array<object>} groupedStationsAggr - The person's stations, grouped by ID.
   * @param {object} person - The person object.
   * @param {object} lastKnownChoir - The person's choir data.
   * @param {number} lastRecordedDate - The timestamp of the choir data.
   * @param {Array<L.Marker>} markers - The array to add the main person marker to.
   * @param {Array<L.LayerGroup>} traces - The array to add arrow traces to.
   * @param {Array<L.Circle>} places - The array to add past place markers to.
   * @param {string} wrapperStyle - CSS string for the marker.
   * @param {string} iconCss - CSS string for the marker's icon.
   */
  const createMarkersAndArrowTraces = function (
    orderedStationsAggr,
    groupedStationsAggr,
    person,
    lastKnownChoir,
    lastRecordedDate,
    markers, // This array is mutated
    traces, // This array is mutated
    places, // This array is mutated
    wrapperStyle,
    iconCss
  ) {
    // Loop through the person's stays *in chronological order*
    for (let i = 0; i < orderedStationsAggr.length; i += 1) {
      // Get the station data for the current stay
      const station = groupedStationsAggr.filter(
        (s) => s.stationId === orderedStationsAggr[i].stationId
      )[0];

      // --- Find previous and next station for the popup ---
      // ! next station is not in filtered values!
      const nextStation = person.orderedStationsAggr[i + 1]
        ? person.groupedStationsAggr[
            person.orderedStationsAggr[i + 1].stationId
          ]
        : undefined;
      const nextStationStay = person.orderedStationsAggr[i + 1];
      const prevStation = person.orderedStationsAggr[i - 1]
        ? person.groupedStationsAggr[
            person.orderedStationsAggr[i - 1].stationId
          ]
        : undefined;
      const prevStationStay = person.orderedStationsAggr[i - 1];

      // Calculate opacity for past places (intensifies with more stays)
      const placeMarkerOpacity =
        person.orderedStationsAggr.length > 0
          ? 1 / person.orderedStationsAggr.length
          : undefined;

      // --- Create Markers ---
      // only create *person marker* for most current station
      if (i === orderedStationsAggr.length - 1) {
        const stay = orderedStationsAggr[i];

        // This is the LAST (current) station, create the custom person marker
        const marker = createTraceMarker(
          person,
          station,
          1, // Full opacity
          wrapperStyle,
          iconCss
        );
        marker.data = {
          // dateFrom: station.dateFrom, // This is undefined, but I must not change code.
          // dateTo: station.dateTo, // This is undefined, but I must not change code.
          name: person.persId,
          stationIdx: `${orderedStationsAggr[i].stationId}_${orderedStationsAggr[i].stayIdx}`,
        };

        // Create the complex popup
        createPopUpAndTooltipDate(
          marker,
          person,
          lastKnownChoir,
          lastRecordedDate,
          prevStation,
          prevStationStay,
          station,
          stay,
          nextStation,
          nextStationStay
        );
        markers.push(marker);
      } else {
        // This is a *past* station. Create a simple red circle.
        const circle = L.circle([station.lat, station.long], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: placeMarkerOpacity,
          opacity: placeMarkerOpacity,
          radius: mapStore.markerBaseSize * (20 - props.map.getZoom()), // scales with zoom
        });
        circle.data = { name: person.persId };
        circle.bindTooltip(station.stationId);

        // Create a simple popup with just a link to the place
        const [button, icon] = createPlaceViewLinkAndIcon(
          station.stationId,
          emit
        );
        const popupDiv = document.createElement('div');
        popupDiv.appendChild(button);
        popupDiv.appendChild(icon);
        circle.bindPopup(popupDiv);

        places.push(circle);
      }

      // --- Create Traces (Arrows) ---
      // opacity of traces calculated from total number of station changes
      const nofChanges = person.orderedStationsAggr.length - 1;
      const traceOpacity = nofChanges > 0 ? 1 / nofChanges : undefined;

      // create traces for all changes of station
      if (nofChanges > 0 && i < orderedStationsAggr.length - 1) {
        const from = [station.lat, station.long];
        const to = [nextStation.lat, nextStation.long];
        const line = L.polyline([from, to], {
          color: 'black',
          opacity: traceOpacity,
        });

        // Use leaflet-polylinedecorator to add an arrowhead
        const arrowHead = L.polylineDecorator(line, {
          patterns: [
            {
              offset: '100%',
              repeat: 0,
              symbol: L.Symbol.arrowHead({
                pixelSize: 25,
                polygon: false,
                pathOptions: {
                  stroke: true,
                  color: 'black',
                  opacity: traceOpacity,
                },
              }),
            },
          ],
        });
        const arrow = L.layerGroup([line, arrowHead]);
        arrow.data = {
          name: person.persId,
          fromStation: station.stationId,
          toStation: nextStation.stationId,
        };
        traces.push(arrow);
      }
    }
  };

  /**
   * The main render function. Creates all markers and traces for all
   * selected persons based on the current slider date.
   * @param {object} persons - The `persons` object from the `personsStore`.
   * @param {string} wrapperStyle - CSS string for the marker.
   * @param {string} iconCss - CSS string for the marker's icon.
   */
  const createPersonMarkersDate = function (persons, wrapperStyle, iconCss) {
    const personMarkers = [];
    const personTraces = [];
    const placeMarkers = [];

    // ------ iterate over persons from store
    for (const key of Object.keys(persons)) {
      if (!key) continue;

      const person = persons[key];

      // ------ find every station entry the person has up to the currently selected slider value
      // ------ & find dated entry for person that is the next smaller or equal to slider value
      const [stationsTillSelected, stationsIdsTillSelected] =
        findStationsTillSelectedAggr(person);

      // ------- filter out person-place entries with dates higher than slider value
      // Only proceed if the person has *any* records at or before the slider date
      if (props.dateSliderValue >= person.sortedDatesStation[0]) {
        const orderedStationsAggr = stationsIdsTillSelected;
        const groupedStationsAggr = stationsTillSelected;

        // Get the person's choir at this date for the popup
        const [lastRecordedDate, lastKnownChoir] =
          getLastRecordBeforeSelectedDate(
            person,
            props.dateSliderValue,
            'sortedDatesChoir', // key for sorted choir dates
            'choirDate' // key for choir data map
          );

        // create markers and polylines
        const markers = [];
        const traces = [];
        const places = [];
        // This function mutates the markers, traces, and places arrays
        createMarkersAndArrowTraces(
          orderedStationsAggr,
          groupedStationsAggr,
          person,
          lastKnownChoir,
          lastRecordedDate,
          markers,
          traces,
          places,
          wrapperStyle,
          iconCss
        );

        // Add this person's markers to the main arrays
        markers.forEach((m) => personMarkers.push(m));
        traces.forEach((t) => personTraces.push(t));
        places.forEach((p) => placeMarkers.push(p));
      }
    }

    // --- Filter all created markers by the SearchField selection ---
    const markersFilteredName = filterMarkersByDataKey(
      selectedValues.value,
      personMarkers,
      'name' // `name` is the persId
    );
    const tracesFilteredName = filterMarkersByDataKey(
      selectedValues.value,
      personTraces,
      'name'
    );
    const placesFilteredName = filterMarkersByDataKey(
      selectedValues.value,
      placeMarkers,
      'name'
    );

    // create layer groups from the *filtered* markers
    personLayerMarkers = L.layerGroup(markersFilteredName);
    personLayerTraces = L.layerGroup(tracesFilteredName);
    personLayerPlaces = L.layerGroup(placesFilteredName);
  };

  // ------------------------------ FILTER FUNCTIONS

  /**
   * Filters a person's aggregated stations to only those that occurred
   * at or before the current `dateSliderValue`.
   * @param {object} person - The person object from the store.
   * @returns {Array<[Array<object>, Array<object>]>}
   * An array containing:
   * 1. `stationsTillSelected`: Array of *station objects* (grouped).
   * 2. `stationsIdsTillSelected`: Array of *stay objects* (ordered).
   */
  const findStationsTillSelectedAggr = function (person) {
    const stationsTillSelected = [];
    const stationsIdsTillSelected = [];

    // go over groupedStationsAggr in order of orderedStationsAggr
    for (let i = 0; i < person.orderedStationsAggr.length; i += 1) {
      // Check for duplicate station visits (to avoid re-adding)
      if (stationsIdsTillSelected.includes(person.orderedStationsAggr[i])) {
        stationsIdsTillSelected.push(person.orderedStationsAggr[i]); // still push to list for tracing path in order
        continue;
      } // station was already selected for previous stay

      const stationId = person.orderedStationsAggr[i].stationId;
      const stayIdx = person.orderedStationsAggr[i].stayIdx;
      const station = person.groupedStationsAggr[stationId];
      // Get the *start date* of this stay
      const ts = station.stays[stayIdx].dateFrom;

      // if a stay with dateFrom <= sliderValue is found: add to stationsTillSelected
      if (ts < props.dateSliderValue) {
        stationsTillSelected.push(station);
        stationsIdsTillSelected.push(person.orderedStationsAggr[i]);
        if (i === person.orderedStationsAggr.length - 1) {
          // End of the list
          break;
        }
      } else if (ts === props.dateSliderValue) {
        // Exact match
        stationsTillSelected.push(station);
        stationsIdsTillSelected.push(person.orderedStationsAggr[i]);
        break; // Found the last one at or on this date
      } else {
        // This stay is in the future
        break; // since stays are ordered, there should be no earlier stay listed after the first one after the selected time
      }
    }

    return [stationsTillSelected, stationsIdsTillSelected];
  };

  // ------------------------------ UPDATE FUNCTIONS

  /**
   * In the persons view, markers represent a person. Therefore, if the year changes, a markers
   * position may have to be updated according to the slider value. Since markers / polylines cannot be created without lat/long,
   * 'keeping' and updating empty markers is not possible. Instead, the watch function on slider value and the
   * onSelectedNamesUpdate function have to create all markers for persons which have a location for
   * the respective year, clear the layer and attach the new markers.
   *
   * This already implies filtering by year, after which only filtering by name has to happen.
   */

  /**
   * Watches the `dateSliderValue` prop for changes.
   * This clears all layers, recalculates all markers/traces based on the new date,
   * and adds them back to the map.
   */
  watch(
    () => props.dateSliderValue,
    () => {
      // Only run if layers are initialized
      if (personLayerMarkers && personLayerTraces) {
        // Clear all layers
        personLayerMarkers.clearLayers(); // apparently critical for slider performance to do this before creating new markers...?
        personLayerTraces.clearLayers();
        personLayerPlaces.clearLayers();

        // Re-run the full marker creation process for the new date
        // This function internally filters by the *new* `props.dateSliderValue`
        // and by the *existing* `selectedValues.value`.
        createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);

        // Add the new layers to the map
        showLayer(personLayerMarkers, props.map);
        showLayer(personLayerTraces, props.map);
        showLayer(personLayerPlaces, props.map);
      }
    }
  );

  /**
   * Handles the `update:modelValue` event from the `SearchField` component.
   * This also clears all layers, recalculates all markers/traces, and adds
   * them back, filtered by the new name selection.
   * @param {Array<String>} currentlySelectedValues - The new array of selected person IDs.
   */
  const onSelectedNamesUpdate = function (currentlySelectedValues) {
    // clear pre-selection prop in map component to avoid pre-selection being active next time
    // a user navigates here via tabs
    emit('person-pre-selection-cleared');

    // Only run if layers are initialized
    if (personLayerMarkers && personLayerTraces && personLayerPlaces) {
      // Clear all layers
      personLayerMarkers.clearLayers();
      personLayerTraces.clearLayers();
      personLayerPlaces.clearLayers();

      // Re-run the full marker creation process.
      // `createPersonMarkersDate` will use the new `selectedValues.value`
      // (which was updated by `v-model`) to filter the results.
      createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);

      // Add the new (and now name-filtered) layers to the map
      showLayer(personLayerMarkers, props.map);
      showLayer(personLayerTraces, props.map);
      showLayer(personLayerPlaces, props.map);
    }
  };

  // ------------------------------ COMPONENT LIFECYCLE FUNCTIONS

  /**
   * On component mount:
   * 1. Loads data from the `personsStore` if not already loaded.
   * 2. Updates the infobox with content for this layer.
   * 3. Creates the initial set of markers/traces for the current date.
   * 4. Populates the `nameList` for the `SearchField`.
   * 5. Adds the marker layers to the map.
   */
  onMounted(async () => {
    // 1. Load data
    if (!personsStore.loaded)
      await personsStore.readData(
        personsStore.pathToDataFilePersons,
        personsStore.pathToDataFilePersonsPlaces
      );

    // 2. Update infobox
    props.infobox.update({ headline: infoHeadline, content: infoText });

    // 3. Create initial markers
    createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);

    // 4. Populate search field
    nameList.value = Array.from(Object.keys(personsStore.persons));

    // 5. Add layers to map
    showLayer(personLayerMarkers, props.map);
    showLayer(personLayerTraces, props.map);
    showLayer(personLayerPlaces, props.map);
  });

  /**
   * On component unmount:
   * 1. Hides all layers from the map to clean up.
   */
  onUnmounted(() => {
    hideLayer(personLayerMarkers, props.map);
    hideLayer(personLayerTraces, props.map);
    hideLayer(personLayerPlaces, props.map);
  });
</script>
<template>
  <v-container>
    <!-- The filter/search component for this layer -->
    <SearchField
      v-model="selectedValues"
      @update:modelValue="onSelectedNamesUpdate"
      :v-if="nameList.length > 0"
      :facet="facetName"
      :facetData="nameList"
    />
  </v-container>
</template>
