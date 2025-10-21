<script setup>
  import L from 'leaflet';
  import { useMapStore } from '../stores/mapStore';
  import { usePlacesStore } from '../stores/placesStore';
  import {
    createPersonViewLinkAndIcon,
    createWikidataLinkAndIcon,
    scaleRadiusProportional,
    scaleRadiusProportionalFlannery,
  } from '../mapHelpers.js';
  import { onMounted, ref, defineProps, onUnmounted, watch } from 'vue';
  import SearchField from './SearchField.vue';

  const placesStore = usePlacesStore();
  const mapStore = useMapStore();

  const props = defineProps({
    map: Object,
    sliderValue: Number,
    dateSliderValue: Number,
    placesSelectedFromTrace: Array,
  });

  const emit = defineEmits(['person-selected', 'place-pre-selection-cleared']);

  let currentPlaceMarkers = undefined;
  let placeLayer = undefined;

  const facetName = 'Stationsnamen';
  let nameList = ref([]);
  const selectedValues = ref(props.placesSelectedFromTrace);

  const createPopUpAndTooltip = function (
    circle,
    station,
    lastRecordedDate,
    lastPersonsBeforeSelectedTime
  ) {
    let popUpHtml =
      `<h3>${station.stationId}</h3></br>` +
      `<b>Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):</b></br>`;

    const popupDiv = document.createElement('div');
    popupDiv.innerHTML = popUpHtml;

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

    circle.bindPopup(popupDiv);
    circle.bindTooltip(`${station.stationId}`);
  };

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
          station.personsAggregatedDate[
            station.sortedDates[lastRecordPosition]
          ];
        break;
      } else {
        // if ts > dateSliderValue but also only value? -> do not show marker
        if (station.sortedDates.length === 1) break;

        lastRecordPosition = station.sortedDates.indexOf(ts) - 1;
        lastRecordedDate = station.sortedDates[lastRecordPosition];
        lastPersonsBeforeSelectedTime =
          station.personsAggregatedDate[
            station.sortedDates[lastRecordPosition]
          ];
        break;
      }
    }

    return [lastRecordedDate, lastPersonsBeforeSelectedTime];
  };

  const createCircleMarker = function (
    station,
    lastPersonsBeforeSelectedTime,
    minPersonnelCountAllStations
  ) {
    let radiusScaled;
    let strokeColor;
    let fillColor;
    if (lastPersonsBeforeSelectedTime) {
      // we have data

      if (lastPersonsBeforeSelectedTime.length === 0) {
        // minimal value and 'negative' brushing for known values of zero
        radiusScaled = 1;
        strokeColor = 'grey';
        fillColor = 'grey';
      } else {
        radiusScaled = scaleRadiusProportionalFlannery(
          parseInt(lastPersonsBeforeSelectedTime.count),
          minPersonnelCountAllStations,
          mapStore.markerBaseSizePersonnel
        );

        // radiusScaled = scaleRadiusProportional(
        //   parseInt(lastPersonsBeforeSelectedTime.count),
        //   minPersonnelCountAllStations,
        //   mapStore.markerBaseSizePersonnel
        // );

        strokeColor = 'red';
        fillColor = '#f03';
      }

      // console.log('radius scaled: ' + radiusScaled);
      const circle = L.circleMarker([station.lat, station.long], {
        color: strokeColor,
        weight: 0.5,
        fillColor: fillColor,
        fillOpacity: 0.5,
        radius: radiusScaled,
      });

      circle.data = { stationId: station.stationId, persons: station.persons };

      return circle;
    } else {
      console.warn('Called createCircleMarker without data!');
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
        //console.log(key)

        const station = stations[key];
        //console.log(key, station)

        // console.log('station.persons[sliderValue]: ' + station.persons[props.sliderValue])
        // console.log('mapStore.markerBaseSizePersonnel: ' + mapStore.markerBaseSizePersonnel)
        const [lastRecordedDate, lastPersonsBeforeSelectedTime] =
          getLastRecordBeforeSelectedDate(station, props.dateSliderValue);

        if (lastPersonsBeforeSelectedTime) {
          // only create marker if data is present
          const circle = createCircleMarker(
            station,
            lastPersonsBeforeSelectedTime,
            placesStore.minPersonnelCountAllStations
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

    const filteredByNamesPlaces = filterByStationId(
      selectedValues.value,
      placeMarkers
    );
    placeLayer = L.layerGroup(filteredByNamesPlaces);
    currentPlaceMarkers = placeMarkers;
    placeLayer.addTo(props.map);

    // console.log('markers added to layergroup')
  };

  const filterByStationId = function (selectedValues, placeMarkers) {
    const filteredByNamesPlaces =
      selectedValues.length == 0
        ? placeMarkers
        : placeMarkers.filter((marker) =>
            selectedValues.includes(marker.data.stationId)
          );
    // console.log(filteredByNames)
    // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

    return filteredByNamesPlaces;
  };

  watch(
    () => props.dateSliderValue,
    () => {
      // console.log('triggered watch for date slider!')
      // console.log(`selected date: ${dateSliderValue} = ${new Date(dateSliderValue).toDateString()}`)
      if (currentPlaceMarkers && placeLayer) {
        if (placeLayer) placeLayer.clearLayers();

        createStationMarkersDate(placesStore.stations, props.map);
        showPlacesLayer(placeLayer, props.map);
      }
    }
  );

  const onSelectedNamesUpdate = function (selectedValues, markers) {
    // clear pre-selection prop in map component to avoid pre-selection being active next time
    // a user navigates here via tabs
    emit('place-pre-selection-cleared');
    if (markers && placeLayer) {
      // console.log('On selected names update:')
      // console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
      placeLayer.clearLayers();
      const filteredByStationId =
        selectedValues.length == 0
          ? markers
          : filterByStationId(selectedValues, markers);
      filteredByStationId.forEach((marker) => marker.addTo(placeLayer));
    }
  };

  const showPlacesLayer = function (layergroup, map) {
    layergroup.addTo(map);
  };

  const hidePlacesLayer = function (layergroup, map) {
    if (layergroup) layergroup.removeFrom(map);
  };

  onMounted(async () => {
    // console.log('Places view test prop: ' + props.test);
    // console.log('Places view map prop: ');
    // console.log(props.map);
    // console.log('pathToDataFile: ' + placesStore.pathToDataFile)
    if (!placesStore.loaded) {
      await placesStore.readData(
        placesStore.pathToDataFilePlaces,
        placesStore.pathToDataFilePersonsPlaces,
        placesStore.pathToDataFilePopulationPlaces
      );
    }
    console.log(placesStore.stations);

    if (currentPlaceMarkers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);

    nameList.value = Array.from(Object.keys(placesStore.stations));

    showPlacesLayer(placeLayer, props.map);
  });

  onUnmounted(() => {
    hidePlacesLayer(placeLayer, props.map);
  });
</script>
<template>
  <v-container>
    <SearchField
      v-model="selectedValues"
      @update:modelValue="
        onSelectedNamesUpdate(selectedValues, currentPlaceMarkers)
      "
      :v-if="nameList.length > 0"
      :facet="facetName"
      :facetData="nameList"
    />
    <p>{{ selectedValues }}</p>
  </v-container>
</template>
