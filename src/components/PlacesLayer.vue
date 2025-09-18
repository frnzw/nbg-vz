<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, reactive} from 'vue'

    const placesStore = usePlacesStore();

    // will be set async by event of child component, make reactive to pick that change up in
    // lifecycle methods of vue (e.g. onMount)
    let state = reactive({
        map: undefined
    })

    function onMapIsReady(map) {
        // console.log('Map instance:', map)
        state.map = map;
    }

    const addStationMarkers = function(stations, map) {
        console.log("Attempting to add " + Object.keys(stations).length + " markers")
        for (const key of Object.keys(stations)) {
            if (!key) continue
            if (stations.hasOwnProperty(key)) {
                console.log(key)
                
                const station = stations[key]
                console.log(key, station)

                const marker = L.marker([station.lat, station.long], {
                title: station.stationId
                })

                marker.addTo(map)
            }

        }

    }

    onMounted(async () => {
        console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        await placesStore.readData(placesStore.pathToDataFile)
        console.log(placesStore.stations)

        if (state.map) addStationMarkers(placesStore.stations, state.map)
    })

</script>
<template>
    <!-- <Map @mapIsReady="onMapIsReady" /> -->
</template>