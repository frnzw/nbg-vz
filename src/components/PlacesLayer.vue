<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, ref, defineProps, onUnmounted, watch} from 'vue'
    import SearchField from './SearchField.vue'

    const placesStore = usePlacesStore();

    const props = defineProps({
        map: Object,
        sliderValue: Number
    })

    let placeMarkers = undefined;
    let placeLayer = undefined;

    const facetName = "Stationsnamen"
    let nameList = ref([])
    const selectedValues = ref([])

    const createStationMarkers = function(stations) {
        console.log("Attempting to add " + Object.keys(stations).length + " markers")
        placeMarkers = []
        for (const key of Object.keys(stations)) {
            if (!key) continue
            if (stations.hasOwnProperty(key)) {
                //console.log(key)
                
                const station = stations[key]
                //console.log(key, station)

                const marker = L.marker([station.lat, station.long], {
                title: station.stationId
                })

                const circle = L.circle([station.lat, station.long], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 500
                })

                // @todo include here: year, nofPersonsPresent
                circle.data = {stationName:station.stationId}

                circle.bindPopup(`${station.stationId}`);

                placeMarkers.push(circle)
            }

        }
        const filtered = applyFilters(props.sliderValue, selectedValues.value, placeLayer, placeMarkers)
        placeLayer = L.layerGroup(filtered);
        placeLayer.addTo(props.map)
        console.log('markers added to layergroup')
        

    }

const applyFilters = function(sliderValue, selectedValues, layer) {
        if (layer) layer.clearLayers()
        console.log('removed markers')

        // const filteredByYear = placeMarkers.filter(marker => marker.data.year === sliderValue)
        // console.log(`Filtered markers for year ${sliderValue}: ${filteredByYear.length}`)
        const filteredByYear = placeMarkers
        console.log(`Not yet filtering markers for year.`)
        console.log(typeof(selectedValues))
        console.log(selectedValues)
        const filteredByNames = selectedValues.length == 0 ? filteredByYear : filteredByYear.filter(marker => selectedValues.includes(marker.data.stationName))
        console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return filteredByNames
}

        watch(() => props.sliderValue, (sliderValue) => {
                console.log('triggered watch for slider!')
                if (placeMarkers && placeLayer) {
                    // console.log(selectedValues.value)
                    const filtered = applyFilters(sliderValue, selectedValues.value, placeLayer, placeMarkers)
                    filtered.forEach(marker => marker.addTo(placeLayer))

                }

            })

        const onSelectedNamesUpdate = function (selectedValues, sliderValue, personLayer, personMarkers) {
            if (placeMarkers && placeLayer) {
                console.log('On selected names update:')
                console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
                const filtered = applyFilters(sliderValue, selectedValues, placeLayer, placeMarkers)
                filtered.forEach(marker => marker.addTo(placeLayer))

            }
        }



    const showPlacesLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePlacesLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    onMounted(async () => {
        console.log('Places view test prop: ' + props.test);
        console.log('Places view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        await placesStore.readData(placesStore.pathToDataFile)
        console.log(placesStore.stations)

        if (placeMarkers === undefined) createStationMarkers(placesStore.stations, props.map)
        console.log(Object.keys(placesStore.stations))
        nameList.value = Array.from(Object.keys(placesStore.stations))
        console.log(nameList.value)

        showPlacesLayer(placeLayer, props.map);

    })

    onUnmounted(() => hidePlacesLayer(placeLayer, props.map))

</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate(selectedValues, props.sliderValue, placeLayer, placeMarkers)" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>