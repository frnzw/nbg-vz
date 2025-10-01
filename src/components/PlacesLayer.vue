<script setup>
    import L from "leaflet";
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, ref, defineProps, onUnmounted, watch} from 'vue'
    import SearchField from './SearchField.vue'

    const placesStore = usePlacesStore();

    const props = defineProps({
        map: Object,
        sliderValue: Number,
        dateSliderValue: Number
    })

    let currentPlaceMarkers = undefined;
    let placeLayer = undefined;

    const facetName = "Stationsnamen"
    let nameList = ref([])
    const selectedValues = ref([])
    const markerBaseSize = 500

    const createPopUpAndTooltip = function (circle, station, lastRecordedDate, lastPersonsBeforeSelectedTime) {
        let popUpHtml = `<h3>${station.stationId}</h3></br>`
                      + `<b>Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):</b></br>`

        if (lastPersonsBeforeSelectedTime) {
            for (const p of lastPersonsBeforeSelectedTime.persons) {
                popUpHtml = popUpHtml + `${p.persId} (${p.choir})</br>`
            }
        }
                
        circle.bindPopup(popUpHtml);
        circle.bindTooltip(`${station.stationId}`)
    }

    const getLastRecordBeforeSelectedDate = function(station, dateSliderValue) {

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
                lastPersonsBeforeSelectedTime = station.personsAggregatedDate[station.sortedDates[lastRecordPosition]];
                break; 
            } else {
                // if ts > dateSliderValue but also only value? -> do not show marker
                if (station.sortedDates.length === 1) break

                lastRecordPosition = station.sortedDates.indexOf(ts) - 1;
                lastRecordedDate = station.sortedDates[lastRecordPosition];
                lastPersonsBeforeSelectedTime = station.personsAggregatedDate[station.sortedDates[lastRecordPosition]];
                break;
            }
        }

        return [lastRecordedDate, lastPersonsBeforeSelectedTime];
    }

    const createCircleMarker = function(station, lastPersonsBeforeSelectedTime, markerBaseSize) {
        // scale radius according to last known record
        const radiusScaled = lastPersonsBeforeSelectedTime ? markerBaseSize * parseInt(lastPersonsBeforeSelectedTime.count) : markerBaseSize
        // console.log('radius scaled: ' + radiusScaled)
        const circle = L.circle([station.lat, station.long], {
            color: lastPersonsBeforeSelectedTime ? 'red' : 'grey',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: radiusScaled * (20 - props.map.getZoom())
        });

        circle.data = {stationId:station.stationId, persons:station.persons}
   
        return circle;
    }

    const createStationMarkersDate = function(stations) {
        // console.log("Attempting to add " + Object.keys(stations).length + " markers")
        const placeMarkers = []

        // console.log('resizing markers for slidervalue: ' + props.sliderValue)
        for (const key of Object.keys(stations)) {
            if (!key) continue
            if (stations.hasOwnProperty(key)) {
                //console.log(key)
                
                const station = stations[key]
                //console.log(key, station)
           
                // console.log('station.persons[sliderValue]: ' + station.persons[props.sliderValue])
                // console.log('markerBaseSize: ' + markerBaseSize)
                const [
                    lastRecordedDate, 
                    lastPersonsBeforeSelectedTime ] = getLastRecordBeforeSelectedDate(station, props.dateSliderValue);
                
                const circle = createCircleMarker(station, lastPersonsBeforeSelectedTime, markerBaseSize);
                
                createPopUpAndTooltip(circle, station, lastRecordedDate, lastPersonsBeforeSelectedTime);

                placeMarkers.push(circle)
            }

        }
        const filtered = filterByStationId(selectedValues.value, placeMarkers)
        placeLayer = L.layerGroup(filtered);
        currentPlaceMarkers = placeMarkers;
        placeLayer.addTo(props.map)
        // console.log('markers added to layergroup')
        

    }
    
    const filterByStationId = function(selectedValues, markers) {

        const filteredByNames = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.stationId))
        // console.log(filteredByNames)
        // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return filteredByNames
    }

watch(() => props.dateSliderValue, (dateSliderValue) => {
    // console.log('triggered watch for date slider!')
    // console.log(`selected date: ${dateSliderValue} = ${new Date(dateSliderValue).toDateString()}`)
    if (currentPlaceMarkers && placeLayer) {
        if (placeLayer) placeLayer.clearLayers();
        const placeMarkers = [];                    
            
        for (const key of Object.keys(placesStore.stations)) {
            if (!key) continue
            if (placesStore.stations.hasOwnProperty(key)) {
                //console.log(key)
                
                const station = placesStore.stations[key]
                //console.log(key, station)
           
                // console.log('station.persons[sliderValue]: ' + station.persons[props.sliderValue])
                // console.log('markerBaseSize: ' + markerBaseSize)
                const [
                    lastRecordedDate, 
                    lastPersonsBeforeSelectedTime 
                ] = getLastRecordBeforeSelectedDate(station, dateSliderValue);
                
                const circle = createCircleMarker(station, lastPersonsBeforeSelectedTime, markerBaseSize);
                
                createPopUpAndTooltip(circle, station, lastRecordedDate, lastPersonsBeforeSelectedTime);

                placeMarkers.push(circle)
            }

        }
        const filtered = filterByStationId(selectedValues.value, placeMarkers)
        filtered.forEach(marker => marker.addTo(placeLayer))
        currentPlaceMarkers = placeMarkers;
    }

})

        const onSelectedNamesUpdate = function (selectedValues, markers) {
            if (markers && placeLayer) {
                // console.log('On selected names update:')
                // console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
                placeLayer.clearLayers()
                const filteredByStationId = selectedValues.length == 0 ? markers : filterByStationId(selectedValues, markers)
                filteredByStationId.forEach(marker => marker.addTo(placeLayer))

            }
        }



    const showPlacesLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePlacesLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    onMounted(async () => {
        // console.log('Places view test prop: ' + props.test);
        // console.log('Places view map prop: ');
        // console.log(props.map);
        // console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        await placesStore.readData(placesStore.pathToDataFile)
        // console.log(placesStore.stations)

        if (currentPlaceMarkers === undefined) createStationMarkersDate(placesStore.stations, props.map)
        // console.log(Object.keys(placesStore.stations))
        nameList.value = Array.from(Object.keys(placesStore.stations))
        // console.log(nameList.value)

        showPlacesLayer(placeLayer, props.map);

    })

    onUnmounted(() => hidePlacesLayer(placeLayer, props.map))

</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate(selectedValues, currentPlaceMarkers)" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>