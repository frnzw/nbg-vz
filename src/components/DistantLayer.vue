<script setup>
import L from "leaflet";
import { usePersonsStore } from "../stores/personsStore";
import { usePlacesStore } from "../stores/placesStore";
import { useMapStore } from "../stores/mapStore";
import { createPersonViewLinkAndIcon } from "../mapHelpers.js";
import { onMounted, watch, defineProps, onUnmounted } from "vue";

// ----------------- Setup / Component Scope Constants -------------------------
const placesStore = usePlacesStore();
const personsStore = usePersonsStore();
const mapStore = useMapStore();

const props = defineProps({
  map: Object,
  dateSliderValue: Number,
});

const emit = defineEmits(["person-selected", "place-selected"]);

let allPlaceMarkers = undefined;
let placeLayer = undefined;

// ----------------- Filtering and Updating -------------------------

const getLastRecordBeforeSelectedDate = function (station, dateSliderValue) {
  // find last record before selected data of slider
  let lastRecordPosition;
  let lastRecordedDate;
  let lastPersonsBeforeSelectedTime;
  for (const ts of station.sortedDates) {
    if (ts < dateSliderValue) {
      continue;
    } else if (ts === dateSliderValue) {
      lastRecordPosition = station.sortedDates.indexOf(ts);
      lastRecordedDate = station.sortedDates[lastRecordPosition];
      lastPersonsBeforeSelectedTime =
        station.personsAggregatedDate[station.sortedDates[lastRecordPosition]];
      break;
    } else {
      // if ts > dateSliderValue but also only value? -> do not show marker
      if (station.sortedDates.length === 1) break;

      // found a date > selected value -> select the date before
      lastRecordPosition = station.sortedDates.indexOf(ts) - 1;
      lastRecordedDate = station.sortedDates[lastRecordPosition];
      lastPersonsBeforeSelectedTime =
        station.personsAggregatedDate[station.sortedDates[lastRecordPosition]];

      break;
    }
  }

  // all recorded dates are smaller than selected date -> show no data

  return [lastRecordedDate, lastPersonsBeforeSelectedTime];
};

const getPersonsCurrentPreviousNextStation = function (
  person,
  oldDateSliderValue,
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
      if (
        [
          "Ulbricht_XX",
          "Ulbricht_XY",
          "Mehlhose_XX",
          "Mehlhose_XY",
          "Herbrich_XY",
          "Richter_XY",
        ].includes(person.personId)
      ) {
        console.log(`caught exact match for selected date: ${new Date(ts)}`);
        console.log(person.personId);
      }

      if (lastRecordPosition === 0) {
        if (
          [
            "Ulbricht_XX",
            "Ulbricht_XY",
            "Mehlhose_XX",
            "Mehlhose_XY",
            "Herbrich_XY",
            "Richter_XY",
          ].includes(person.personId)
        ) {
          console.log("last record position is 0");
        }
        previousStationBeforeSelectedTime = undefined;
        nextRecordedDate = person.sortedDatesStation[lastRecordPosition + 1];
        nextStationAfterSelectedTime = person.stationsDate[nextRecordedDate];
      } else if (lastRecordPosition === person.sortedDatesStation.length - 1) {
        previousRecordedDate =
          person.sortedDatesStation[lastRecordPosition - 1];
        previousStationBeforeSelectedTime =
          person.stationsDate[previousRecordedDate];

        if (
          [
            "Ulbricht_XX",
            "Ulbricht_XY",
            "Mehlhose_XX",
            "Mehlhose_XY",
            "Herbrich_XY",
            "Richter_XY",
          ].includes(person.personId)
        ) {
          console.log(
            "last record position is last of array, previousStationBeforeSelectedTime should be defined",
          );
          console.log(`last record position = ${lastRecordPosition}`);
          console.log(
            `previousStationBeforeSelectedTime = ${JSON.stringify(person.stationsDate[previousRecordedDate])}`,
          );
          console.log(`sortedDatesStation = ${person.sortedDatesStation}`);
          console.log(`stationsDate = ${person.sortedDatesStation}`);
        }

        nextStationAfterSelectedTime = undefined;
      } else {
        if (
          [
            "Ulbricht_XX",
            "Ulbricht_XY",
            "Mehlhose_XX",
            "Mehlhose_XY",
            "Herbrich_XY",
            "Richter_XY",
          ].includes(person.personId)
        ) {
          console.log(
            "last record position is in between, previousStationBeforeSelectedTime should be defined",
          );
        }
        previousRecordedDate =
          person.sortedDatesStation[lastRecordPosition - 1];
        previousStationBeforeSelectedTime =
          person.stationsDate[previousRecordedDate];

        nextRecordedDate = person.sortedDatesStation[lastRecordPosition + 1];
        nextStationAfterSelectedTime = person.stationsDate[nextRecordedDate];
      }
      if (
        [
          "Ulbricht_XX",
          "Ulbricht_XY",
          "Mehlhose_XX",
          "Mehlhose_XY",
          "Herbrich_XY",
          "Richter_XY",
        ].includes(person.personId)
      ) {
        console.log(
          `from ${JSON.stringify(previousStationBeforeSelectedTime)} to ${JSON.stringify(lastStationBeforeSelectedTime)}`,
        );
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
          nextRecordedDate = person.sortedDatesStation[lastRecordPosition + 1];
          nextStationAfterSelectedTime = person.stationsDate[nextRecordedDate];
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

const createPlaceViewLinkAndIcon = function (stationId) {
  const button = document.createElement("button");
  button.style.color = "#0078A8";
  button.style.textDecoration = "underline";
  button.title = "View Place in Place View";
  button.textContent = `${stationId}`;
  button.onclick = async function () {
    console.log(`Clicked on ${stationId}`);
    emit("place-selected", stationId);
  };

  const icon = document.createElement("i");
  icon.classList.add("mdi", "mdi-map-marker");
  icon.style.paddingLeft = "3px";

  return [button, icon];
};

// const createPersonViewLinkAndIcon = function(persId) {
//     const button = document.createElement('button');
//     button.style.color = '#0078A8';
//     button.style.textDecoration = 'underline';
//     button.title ='View Person in Person View';
//     button.textContent = `${persId}`;
//     button.onclick = async function() {
//         console.log(`Clicked on ${persId}`);
//         emit('person-selected', persId)
//     }

//     const icon = document.createElement('i');
//     icon.classList.add('mdi', 'mdi-account-outline');
//     icon.style.paddingLeft = '3px';

//     return [button, icon]
// }

const createPopUpAndTooltip = function (
  circle,
  station,
  lastRecordedDate,
  lastPersonsBeforeSelectedTime,
) {
  const [button, icon] = createPlaceViewLinkAndIcon(station.stationId);
  const heading = document.createElement("h3");
  heading.appendChild(button);
  heading.appendChild(icon);

  const subheading = document.createElement("b");
  subheading.textContent = `Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ""} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : "keine Daten"}):`;

  const popupDiv = document.createElement("div");
  popupDiv.appendChild(heading);
  popupDiv.appendChild(document.createElement("br"));
  popupDiv.appendChild(subheading);
  popupDiv.appendChild(document.createElement("br"));

  if (lastPersonsBeforeSelectedTime) {
    for (const [
      index,
      person,
    ] of lastPersonsBeforeSelectedTime.persons.entries()) {
      const [button, icon] = createPersonViewLinkAndIcon(person.persId);
      popupDiv.appendChild(button);
      popupDiv.appendChild(icon);
      if (index < lastPersonsBeforeSelectedTime.persons.length - 1)
        popupDiv.appendChild(document.createElement("br"));
    }
  }

  circle.bindPopup(popupDiv);
  circle.bindTooltip(`${station.stationId}`);
};

const updateMarkerAndPopUp = function (
  marker,
  station,
  lastRecordedDate,
  lastPersonsBeforeSelectedTime,
) {
  const [button, icon] = createPlaceViewLinkAndIcon(station.stationId);
  const heading = document.createElement("h3");
  heading.appendChild(button);
  heading.appendChild(icon);

  const subheading = document.createElement("b");
  subheading.textContent = `Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ""} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : "keine Daten"}):`;

  const popupDiv = document.createElement("div");
  popupDiv.appendChild(heading);
  popupDiv.appendChild(document.createElement("br"));
  popupDiv.appendChild(subheading);
  popupDiv.appendChild(document.createElement("br"));

  if (lastPersonsBeforeSelectedTime) {
    // update marker with final persCount for the date, including new arrivals and deaths
    marker.data.persCount = lastPersonsBeforeSelectedTime.count;
    marker.setRadius(updatePlaceMarkerRadius(marker.data.persCount));

    // update popup accordingly
    for (const [
      index,
      person,
    ] of lastPersonsBeforeSelectedTime.persons.entries()) {
      const [button, icon] = createPersonViewLinkAndIcon(person.persId);
      popupDiv.appendChild(button);
      popupDiv.appendChild(icon);
      if (index < lastPersonsBeforeSelectedTime.persons.length - 1)
        popupDiv.appendChild(document.createElement("br"));
    }
  } else {
    marker.setRadius(updatePlaceMarkerRadius(0));
  }

  marker.setStyle({
    color: lastPersonsBeforeSelectedTime ? "red" : "grey",
  });
  marker.setPopupContent(popupDiv);
};

const createCircleMarker = function (station, lastPersonsBeforeSelectedTime) {
  // scale radius according to last known record
  const radiusScaled = lastPersonsBeforeSelectedTime
    ? mapStore.markerBaseSize * parseInt(lastPersonsBeforeSelectedTime.count)
    : mapStore.markerBaseSize;
  // console.log('radius scaled: ' + radiusScaled)
  const circle = L.circle([station.lat, station.long], {
    color: lastPersonsBeforeSelectedTime ? "red" : "grey",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: radiusScaled * (20 - props.map.getZoom()),
  });

  circle.data = {
    stationId: station.stationId,
    persCount: lastPersonsBeforeSelectedTime
      ? lastPersonsBeforeSelectedTime.count
      : 0,
  };

  return circle;
};

const createStationMarkersDate = function (stations) {
  // console.log("Attempting to add " + Object.keys(stations).length + " markers")
  const placeMarkers = [];

  // console.log('resizing markers for slidervalue: ' + props.sliderValue)
  for (const key of Object.keys(stations)) {
    if (!key) continue;
    if (stations.hasOwnProperty(key)) {
      //console.log(key)

      const station = stations[key];
      //console.log(key, station)

      // console.log('station.persons[sliderValue]: ' + station.persons[props.sliderValue])
      // console.log('mapStore.markerBaseSize: ' + mapStore.markerBaseSize)
      const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
        getLastRecordBeforeSelectedDate(station, props.dateSliderValue);

      const circle = createCircleMarker(station, lastPersonsBeforeSelectedTime);

      createPopUpAndTooltip(
        circle,
        station,
        lastRecordedDate,
        lastPersonsBeforeSelectedTime,
      );

      placeMarkers.push(circle);
    }
  }
  //const filtered = filterByStationId(selectedValues.value, placeMarkers)
  placeLayer = L.layerGroup(placeMarkers);
  allPlaceMarkers = placeMarkers;
  placeLayer.addTo(props.map);
  console.log("markers added to layergroup");
  console.log(allPlaceMarkers);
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
) {
  // progress, i.e. proportion of line that should have been
  // passed at time since animation started [0,1]
  // => e.g if animation time = 1000 ms, 500 ms passed since start => 0.5
  // => current position is at half the distance

  const progressOnLine = (time - startTime) / duration;

  if (progressOnLine >= 1) {
    persMarker.setLatLng(markerEnd.getLatLng());
    // update end markers person count and radius
    markerEnd.data.persCount = markerEnd.data.persCount + 1;
    markerEnd.setRadius(updatePlaceMarkerRadius(markerEnd.data.persCount));
    persMarker.removeFrom(props.map);
    return; // end animation
  }

  // transform LatLng to pixel coordinates with native leaflet function
  const startPoint = props.map.latLngToLayerPoint(markerStart.getLatLng());
  const endPoint = props.map.latLngToLayerPoint(markerEnd.getLatLng());

  // calculate the current position using the expected progress on the
  // line at the current time since animation started
  const currentPoint = L.point(
    startPoint.x + (endPoint.x - startPoint.x) * progressOnLine,
    startPoint.y + (endPoint.y - startPoint.y) * progressOnLine,
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
      ),
  );
}

const updatePlaceMarkerRadius = function (persCount) {
  if (persCount === 0) {
    return mapStore.markerBaseSize;
  } else {
    return mapStore.markerBaseSize * persCount * (20 - props.map.getZoom());
  }
};

const testNativeMovingMarker = async function (markerStart, markerEnd) {
  // a temporary person marker that will be moved across the map
  const persMarker = L.circle(markerStart.getLatLng(), {
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.5,
  });
  persMarker.addTo(props.map);

  const duration = 500;

  const startTime = performance.now();

  // start animation
  // update start markers radius here
  if (markerStart.data.persCount > 0)
    markerStart.data.persCount = markerStart.data.persCount - 1;
  markerStart.setRadius(updatePlaceMarkerRadius(markerStart.data.persCount));
  requestAnimationFrame((t) =>
    animateMarker(
      t,
      persMarker,
      markerStart,
      markerEnd,
      duration,
      startTime,
      persId,
    ),
  );
};

const createNativeMovingMarker = async function (
  markerStart,
  markerEnd,
  persId,
) {
  // a temporary person marker that will be moved across the map
  const persMarker = L.circle(markerStart.getLatLng(), {
    color: "blue",
    fillColor: "blue",
    fillOpacity: 0.5,
  });
  persMarker.addTo(props.map);

  const duration = 500;

  const startTime = performance.now();

  // start animation
  // update start markers radius here
  if (markerStart.data.persCount > 0)
    markerStart.data.persCount = markerStart.data.persCount - 1;
  markerStart.setRadius(updatePlaceMarkerRadius(markerStart.data.persCount));
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
      ),
  );

  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
};

// ----------------- Lifecycle Functions -------------------------
const showPlacesLayer = function (layergroup, map) {
  layergroup.addTo(map);
};

const hidePlacesLayer = function (layergroup, map) {
  layergroup.removeFrom(map);
};

onMounted(async () => {
  console.log("RENDERED DISTANT LAYER");
  console.log("Distant view map prop: ");
  console.log(props.map);
  console.log("pathToDataFile: " + placesStore.pathToDataFile);
  if (!placesStore.loaded)
    await placesStore.readData(
      placesStore.pathToDataFilePlaces,
      placesStore.pathToDataFilePersonsPlaces,
    );
  if (!personsStore.loaded)
    await personsStore.readData(
      personsStore.pathToDataFilePersons,
      personsStore.pathToDataFilePersonsPlaces,
    );

  console.log(placesStore.stations);
  console.log(personsStore.persons);

  if (allPlaceMarkers === undefined)
    createStationMarkersDate(placesStore.stations, props.map);

  showPlacesLayer(placeLayer, props.map);
});

onUnmounted(() => hidePlacesLayer(placeLayer, props.map));

watch(
  () => props.dateSliderValue,
  async (newDateSliderValue, oldDateSliderValue) => {
    console.log(
      `triggered watch for slider! old = ${oldDateSliderValue}, new = ${newDateSliderValue}`,
    );

    const animateMarkerPromises = [];
    for (const key of Object.keys(personsStore.persons)) {
      if (!key) continue;
      const person = personsStore.persons[key];
      const [currentStation, previousStation, nextStation] =
        getPersonsCurrentPreviousNextStation(person, oldDateSliderValue);

      if (person.personId === "deFries_XY") {
        console.log(previousStation, currentStation, nextStation);
      }

      // animation FORWARD in time
      if (newDateSliderValue >= oldDateSliderValue) {
        // if (person.personId === 'Richter_XY') {
        //     console.log('FORWARDS!');
        // }
        if (!(previousStation && currentStation)) continue; // if person has no previous recorded place, go to next person

        // if person has changed place, trigger animation
        if (previousStation.stationId != currentStation.stationId) {
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

          // console.log(`Trigger animation for ${person.personId} from ${JSON.stringify(previousMarker.data)} to ${JSON.stringify(currentMarker.data)}`);
          // if (person.personId === 'Teutsch_XX') {
          //     console.log(previousMarker.data);
          //     console.log(currentMarker.data);
          //     animateMarkerPromises.push(createNativeMovingMarker(previousMarker, currentMarker, person.personId));
          // }
          animateMarkerPromises.push(
            createNativeMovingMarker(
              previousMarker,
              currentMarker,
              person.personId,
            ),
          );
        }
      } else {
        // animation BACKWARD in time

        if (person.personId === "Richter_XY") {
          console.log("BACKWARDS!");
        }
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
          // if (person.personId === 'Richter_XY') {
          //     console.log(nextMarker.data);
          //     console.log(currentMarker.data);
          //     animateMarkerPromises.push(createNativeMovingMarker(nextMarker, currentMarker, person.personId));

          // }
          animateMarkerPromises.push(
            createNativeMovingMarker(
              nextMarker,
              currentMarker,
              person.personId,
            ),
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

    console.log("animations finished!");

    for (const key of Object.keys(placesStore.stations)) {
      if (!key) continue;
      const station = placesStore.stations[key];

      const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
        getLastRecordBeforeSelectedDate(station, props.dateSliderValue);

      // this would be easier with a hashmap built upon initial marker creation
      let stationMarker;
      for (const m of allPlaceMarkers) {
        if (m.data.stationId === station.stationId) stationMarker = m;
      }

      updateMarkerAndPopUp(
        stationMarker,
        station,
        lastRecordedDate,
        lastPersonsBeforeSelectedTime,
      );
    }
  },
);
</script>
<template></template>
