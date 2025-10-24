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

  const infoHeadline = 'Distant View';
  const infoText = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  `;

  const placesStore = usePlacesStore();
  const personsStore = usePersonsStore();
  const mapStore = useMapStore();

  const props = defineProps({
    map: Object,
    infobox: Object,
    dateSliderValue: Number,
  });

  const emit = defineEmits(['person-selected', 'place-selected']);

  let allPlaceMarkers = undefined;
  let placeLayer = undefined;

  // ----------------- Filtering and Updating -------------------------

  const getPersonsCurrentPreviousNextStation = function (
    person,
    oldDateSliderValue
  ) {
    let lastRecordPosition;
    let lastRecordedDate;
    let lastStationBeforeSelectedTime;

    let previousRecordedDate;
    let previousStationBeforeSelectedTime;

    let nextRecordedDate;
    let nextStationAfterSelectedTime;

    for (const ts of person.sortedDatesStation) {
      if (ts < props.dateSliderValue) {
        continue;
      } else if (ts === props.dateSliderValue) {
        lastRecordPosition = person.sortedDatesStation.indexOf(ts);
        lastRecordedDate = person.sortedDatesStation[lastRecordPosition];
        lastStationBeforeSelectedTime = person.stationsDate[lastRecordedDate];

        if (lastRecordPosition === 0) {
          previousStationBeforeSelectedTime = undefined;
          nextRecordedDate = person.sortedDatesStation[lastRecordPosition + 1];
          nextStationAfterSelectedTime = person.stationsDate[nextRecordedDate];
        } else if (
          lastRecordPosition ===
          person.sortedDatesStation.length - 1
        ) {
          previousRecordedDate =
            person.sortedDatesStation[lastRecordPosition - 1];
          previousStationBeforeSelectedTime =
            person.stationsDate[previousRecordedDate];

          nextStationAfterSelectedTime = undefined;
        } else {
          previousRecordedDate =
            person.sortedDatesStation[lastRecordPosition - 1];
          previousStationBeforeSelectedTime =
            person.stationsDate[previousRecordedDate];

          nextRecordedDate = person.sortedDatesStation[lastRecordPosition + 1];
          nextStationAfterSelectedTime = person.stationsDate[nextRecordedDate];
        }

        break;
      } else {
        // if ts > dateSliderValue but also only value? -> do not show marker
        if (person.sortedDatesStation.length === 1) {
          lastStationBeforeSelectedTime = undefined;
          previousStationBeforeSelectedTime = undefined;
          nextRecordedDate = undefined;
          nextStationAfterSelectedTime = undefined;
        } else {
          lastRecordPosition = person.sortedDatesStation.indexOf(ts) - 1;
          lastRecordedDate = person.sortedDatesStation[lastRecordPosition];
          lastStationBeforeSelectedTime = person.stationsDate[lastRecordedDate];

          previousRecordedDate =
            person.sortedDatesStation[lastRecordPosition - 1];
          previousStationBeforeSelectedTime =
            person.stationsDate[previousRecordedDate];

          if (lastRecordPosition === person.sortedDatesStation.length - 1) {
            // no next station recorded
            nextRecordedDate = undefined;
            nextStationAfterSelectedTime = undefined;
          } else {
            nextRecordedDate =
              person.sortedDatesStation[lastRecordPosition + 1];
            nextStationAfterSelectedTime =
              person.stationsDate[nextRecordedDate];
          }
        }

        break;
      }
    }

    // special rule for navigating backwards on slider:
    // only set nextStation if it was visible on the date user is navigating from
    if (nextRecordedDate) {
      if (nextRecordedDate > oldDateSliderValue) {
        nextStationAfterSelectedTime = undefined;
      }
    }

    return [
      lastStationBeforeSelectedTime,
      previousStationBeforeSelectedTime,
      nextStationAfterSelectedTime,
    ];
  };

  // ----------------- Marker and Popup Creation -------------------------

  const createPopUpAndTooltip = function (
    circle,
    station,
    lastRecordedDate,
    lastPersonsBeforeSelectedTime
  ) {
    const [button, icon] = createPlaceViewLinkAndIcon(station.stationId, emit);
    const heading = document.createElement('h3');
    heading.appendChild(button);
    heading.appendChild(icon);

    const subheading = document.createElement('b');
    subheading.textContent = `Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):`;

    const popupDiv = document.createElement('div');
    popupDiv.appendChild(heading);
    popupDiv.appendChild(document.createElement('br'));
    popupDiv.appendChild(subheading);
    popupDiv.appendChild(document.createElement('br'));

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

  const createStationMarker = function (station) {
    const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
      getLastRecordBeforeSelectedDate(
        station,
        props.dateSliderValue,
        'sortedDates',
        'personsAggregatedDate'
      );

    if (lastPersonsBeforeSelectedTime) {
      const circle = createCircleMarker(
        station,
        lastPersonsBeforeSelectedTime.count,
        placesStore.minPersonnelCountAllStations,
        'red',
        true,
        true,
        mapStore.markerBaseSizePersonnel,
        null
      );

      ((circle.data.persCount = lastPersonsBeforeSelectedTime.count),
        createPopUpAndTooltip(
          circle,
          station,
          lastRecordedDate,
          lastPersonsBeforeSelectedTime
        ));

      return circle;
    } else {
      return undefined;
    }
  };

  const createStationMarkersDate = function (stations) {
    // console.log("Attempting to add " + Object.keys(stations).length + " markers")
    const placeMarkers = [];

    // console.log('resizing markers for slidervalue: ' + props.sliderValue)
    for (const key of Object.keys(stations)) {
      if (!key) continue;
      if (stations.hasOwnProperty(key)) {
        const station = stations[key];

        const circle = createStationMarker(station);
        if (circle) placeMarkers.push(circle);
      }
    }

    // console.log(placeMarkers);
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

    if (progressOnLine >= 1) {
      // if (markerEnd.data.stationId === 'Genadendal') {
      //   console.log(`radius Genadendal END: ${markerEnd.getRadius()}`);
      // }
      persMarker.setLatLng(markerEnd.getLatLng());
      // update end markers person count and radius
      markerEnd.data.persCount = markerEnd.data.persCount + 1;

      markerEnd.setRadius(
        scaleRadiusProportionalFlannery(
          markerEnd.data.persCount,
          minPersonnelCountAllStations,
          mapStore.markerBaseSizePersonnel
        )
      );
      // if (markerEnd.data.stationId === 'Genadendal') {
      //   console.log(`markerEnd.data.persCount: ${markerEnd.data.persCount}`);
      //   console.log(
      //     `minPersonnelCountAllStations: ${minPersonnelCountAllStations}`
      //   );
      //   console.log(
      //     `mapStore.markerBaseSizePersonnel: ${mapStore.markerBaseSizePersonnel}`
      //   );
      //   console.log(`radius Genadendal END UPDATED: ${markerEnd.getRadius()}`);
      // }
      persMarker.removeFrom(props.map);
      return; // end animation
    }

    // if (!markerStart)
    //   console.log(`persId: ${persId}; markerEnd: ${markerEnd.stationId}`);
    // if (!markerEnd)
    //   console.log(`persId: ${persId}; markerStart: ${markerStart.stationId}`);

    // transform LatLng to pixel coordinates with native leaflet function
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

    // call animation function again
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

    const duration = 500;

    const startTime = performance.now();

    // start animation
    // update start markers radius here
    if (markerStart.data.persCount > 0)
      markerStart.data.persCount = markerStart.data.persCount - 1;
    // if (markerStart.data.stationId === 'Genadendal') {
    //   console.log(`radius Genadendal START: ${markerStart.getRadius()}`);
    // }
    markerStart.setRadius(
      scaleRadiusProportionalFlannery(
        markerStart.data.persCount,
        minPersonnelCountAllStations,
        mapStore.markerBaseSizePersonnel
      )
    );
    // if (markerStart.data.stationId === 'Genadendal') {
    //   console.log(
    //     `radius Genadendal START UPDATED: ${markerStart.getRadius()}`
    //   );
    // }
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

    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  };

  // ----------------- Lifecycle Functions -------------------------

  onMounted(async () => {
    console.log('RENDERED DISTANT LAYER');
    // console.log('Distant view map prop: ');
    // console.log(props.map);
    // console.log('pathToDataFile: ' + placesStore.pathToDataFile);
    if (!placesStore.loaded)
      await placesStore.readData(
        placesStore.pathToDataFilePlaces,
        placesStore.pathToDataFilePersonsPlaces
      );
    if (!personsStore.loaded)
      await personsStore.readData(
        personsStore.pathToDataFilePersons,
        personsStore.pathToDataFilePersonsPlaces
      );

    // fill info box with content describing this layer
    props.infobox.update({ headline: infoHeadline, content: infoText });

    console.log(placesStore.stations);
    console.log(personsStore.persons);

    if (allPlaceMarkers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);

    showLayer(placeLayer, props.map);
  });

  onUnmounted(() => hideLayer(placeLayer, props.map));

  watch(
    () => props.dateSliderValue,
    async (newDateSliderValue, oldDateSliderValue) => {
      // console.log(
      //   `triggered watch for slider! old = ${oldDateSliderValue}, new = ${newDateSliderValue}`
      // );
      // console.log(
      //   `mapStore.dateFirstRecordsPlace ${mapStore.dateFirstRecordsPlace}`
      // );

      // if newDate is first date there are records for AND we have moved FORWARDS in time:
      // (re-)create all markers having data for this date, (re-)create layer
      if (
        newDateSliderValue === mapStore.dateFirstRecordsPlace &&
        newDateSliderValue > oldDateSliderValue
      ) {
        // console.log('Stepped INTO data range!');
        createStationMarkersDate(placesStore.stations, props.map);
      }
      // if oldDate is first date there are records for AND we have moved BACKWARDS in time:
      // just hide the layer
      if (
        oldDateSliderValue === mapStore.dateFirstRecordsPlace &&
        newDateSliderValue < oldDateSliderValue
      ) {
        // console.log('Stepped OUT data range: BEFORE!');
        hideLayer(placeLayer, props.map);
      }

      const animateMarkerPromises = [];
      for (const key of Object.keys(personsStore.persons)) {
        if (!key) continue;
        const person = personsStore.persons[key];
        const [lastRecordedDate, currentStation, previousStation, nextStation] =
          getRecordsAroundDate(
            person,
            props.dateSliderValue,
            'sortedDatesStation',
            'stationsDate',
            oldDateSliderValue,
            false
          );

        // animation FORWARD in time
        if (newDateSliderValue >= oldDateSliderValue) {
          if (!(previousStation && currentStation)) continue; // if person has no previous recorded place, go to next person

          // if person has changed place, trigger animation
          if (previousStation.stationId != currentStation.stationId) {
            // if on of current stations is not yet in allPlaceMarkers -> add it:

            if (
              !allPlaceMarkers
                .map((m) => m.data.stationId)
                .includes(currentStation.stationId)
            ) {
              // console.log(`Adding markers for station:`);
              // console.log(placesStore.stations[currentStation.stationId]);
              // ! create marker using the entry from places store, currentStation-Object from above
              // is from person.stationsDate entry -> does not contain all data for marker creation
              const circle = createStationMarker(
                placesStore.stations[currentStation.stationId]
              );
              // console.log(`Created marker:`);
              // console.log(circle);
              if (circle) allPlaceMarkers.push(circle);
              circle.addTo(placeLayer);
            }

            if (
              !allPlaceMarkers
                .map((m) => m.data.stationId)
                .includes(previousStation.stationId)
            ) {
              // console.log(`Adding markers for station:`);
              // console.log(placesStore.stations[previousStation.stationId]);
              // ! create marker using the entry from places store, currentStation-Object from above
              // is from person.stationsDate entry -> does not contain all data for marker creation
              const circle = createInitialMarker(
                placesStore.stations[currentStation.stationId]
              );
              // console.log(`Created marker:`);
              // console.log(circle);
              if (circle) allPlaceMarkers.push(circle);
              circle.addTo(placeLayer);
            }

            // console.log(
            //   `Retrieving markers for ${person.persId} from ${JSON.stringify(previousStation)} to ${JSON.stringify(currentStation)}`
            // );
            // console.log(allPlaceMarkers.map((m) => m.data.stationId));
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
          // animation BACKWARD in time

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

            // console.log(`Trigger animation for ${person.personId} from ${JSON.stringify(nextMarker.data)} to ${JSON.stringify(currentMarker.data)}`);

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

      // sort of a hack: await Promises with timeout equal to animation length
      // for each animation, to have async animations finished before setting final marker
      // properties for the currently selected date
      // --- this is necessary since persons previously unrecorded may pop up at stations,
      // others may have died or not properly recoreded elsewhere after moving – both
      // need to be taken into account for total person count on a particular date
      await Promise.all(animateMarkerPromises);

      // console.log('animations finished!');
      placeLayer.clearLayers();
      createStationMarkersDate(placesStore.stations, props.map);
    }
  );
</script>
<template></template>
