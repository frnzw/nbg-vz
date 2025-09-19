<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, reactive, defineProps, onUnmounted} from 'vue'

    const placesStore = usePlacesStore();

    const props = defineProps({
        test: String,
        map: Object
    })

    let placeMarkers = undefined;

    const createStationMarkers = function(stations, map) {
        console.log("Attempting to add " + Object.keys(stations).length + " markers")
        const markers = []
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

                circle.bindPopup(`${station.stationId}`);

                markers.push(circle)
            }

        }
        placeMarkers = L.layerGroup(markers);

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

        showPlacesLayer(placeMarkers, props.map);

    })

    onUnmounted(() => hidePlacesLayer(placeMarkers, props.map))

</script>
<template>

</template>