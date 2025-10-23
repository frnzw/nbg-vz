<script setup>
  import L from 'leaflet';
  import { useMapStore } from '../stores/mapStore.js';
  import { usePlacesStore } from '../stores/placesStore.js';
  import {
    createCircleMarker,
    filterByStationId,
    showLayer,
    hideLayer,
    getStationsLastRecordBeforeSelectedDate,
  } from '../mapHelpers.js';
  import { onMounted, ref, defineProps, onUnmounted, watch } from 'vue';
  import SearchField from './SearchField.vue';

  const placesStore = usePlacesStore();
  const mapStore = useMapStore();

  const props = defineProps({
    map: Object,
    sliderValue: Number,
    dateSliderValue: Number,
  });

  const emit = defineEmits(['person-selected', 'place-pre-selection-cleared']);

  let currentPop1Markers = undefined;
  let currentPop2Markers = undefined;

  let popLayer1 = undefined;
  let popLayer2 = undefined;

  const facetName = 'Stationsnamen';
  let nameList = ref([]);
  const selectedValues = ref([]);

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

    const subHeadingPop1 = document.createElement('b');
    subHeadingPop1.textContent = 'Gemeindegröße_1: ';
    popupDiv.appendChild(subHeadingPop1);
    if (lastPopBeforeSelectedTime.pop_1) {
      popupDiv.appendChild(
        document.createTextNode(`${lastPopBeforeSelectedTime.pop_1}`)
      );
    }
    popupDiv.appendChild(document.createElement('br'));

    const subHeadingPop2 = document.createElement('b');
    subHeadingPop2.textContent = 'Gemeindegröße_1: ';
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

  const createStationMarkersDate = function (stations) {
    // console.log("Attempting to add " + Object.keys(stations).length + " markers")
    const pop1Markers = [];
    const pop2Markers = [];

    for (const key of Object.keys(stations)) {
      if (!key) continue;
      if (stations.hasOwnProperty(key)) {
        const station = stations[key];

        const [lastRecordedDatePop, lastPopBeforeSelectedTime] =
          getStationsLastRecordBeforeSelectedDate(
            station,
            props.dateSliderValue,
            'sortedDatesPop',
            'populationDate'
          );

        if (lastPopBeforeSelectedTime.pop_1) {
          // only create marker if data is present
          const circle = createCircleMarker(
            station,
            lastPopBeforeSelectedTime.pop_1,
            placesStore.minPopulationCountAllStations,
            'blue',
            false,
            true,
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

        if (lastPopBeforeSelectedTime.pop_2) {
          // only create marker if data is present
          const circle = createCircleMarker(
            station,
            lastPopBeforeSelectedTime.pop_2,
            placesStore.minPopulationCountAllStations,
            'red',
            true,
            false,
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

    const filteredByNamesPop1 = filterByStationId(
      selectedValues.value,
      pop1Markers
    );
    popLayer1 = L.layerGroup(filteredByNamesPop1);
    currentPop1Markers = pop1Markers;
    popLayer1.addTo(props.map);

    const filteredByNamesPop2 = filterByStationId(
      selectedValues.value,
      pop2Markers
    );
    popLayer2 = L.layerGroup(filteredByNamesPop2);
    currentPop2Markers = pop2Markers;
    popLayer2.addTo(props.map);
  };

  watch(
    () => props.dateSliderValue,
    () => {
      // console.log('triggered watch for date slider!')
      // console.log(`selected date: ${dateSliderValue} = ${new Date(dateSliderValue).toDateString()}`)
      if (currentPop1Markers && currentPop2Markers && popLayer1 && popLayer2) {
        if (popLayer1) popLayer1.clearLayers();
        if (popLayer2) popLayer2.clearLayers();

        createStationMarkersDate(placesStore.stations, props.map);
        // showPopulationLayer(popLayer1, popLayer2, props.map);
        showLayer(popLayer1, props.map);
        showLayer(popLayer2, props.map);
      }
    }
  );

  const onSelectedNamesUpdate = function (
    selectedValues,
    pop1Markers,
    pop2Markers
  ) {
    // console.log('On selected names update:');
    // console.log(selectedValues); // !!! selectedValues comes from template here, can access directly not via .value

    // clear pre-selection prop in map component to avoid pre-selection being active next time
    // a user navigates here via tabs
    emit('place-pre-selection-cleared');
    if (pop1Markers && pop2Markers && popLayer1 && popLayer2) {
      popLayer1.clearLayers();
      popLayer2.clearLayers();

      const filteredByNamesPop1 = filterByStationId(
        selectedValues,
        pop1Markers
      );
      filteredByNamesPop1.forEach((marker) => marker.addTo(popLayer1));

      const filteredByNamesPop2 = filterByStationId(
        selectedValues,
        pop2Markers
      );
      filteredByNamesPop2.forEach((marker) => marker.addTo(popLayer2));
    }
  };

  onMounted(async () => {
    // console.log('Places view map prop: ');
    // console.log(props.map);
    // console.log('pathToDataFile: ' + placesStore.pathToDataFile)
    await placesStore.readData(
      placesStore.pathToDataFilePlaces,
      placesStore.pathToDataFilePersonsPlaces,
      placesStore.pathToDataFilePopulationPlaces
    );
    console.log(placesStore.stations);

    if (currentPop1Markers === undefined && currentPop2Markers === undefined)
      createStationMarkersDate(placesStore.stations, props.map);
    nameList.value = Array.from(Object.keys(placesStore.stations));

    // showPopulationLayer(popLayer1, popLayer2, props.map);
    showLayer(popLayer1, props.map);
    showLayer(popLayer2, props.map);
  });

  onUnmounted(() => {
    // hidePopulationLayer(popLayer1, popLayer2, props.map);
    hideLayer(popLayer1, props.map);
    hideLayer(popLayer2, props.map);
  });
</script>
<template>
  <v-container>
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
    <p>{{ selectedValues }}</p>
  </v-container>
</template>
