<script setup>
    import Map from './Map.vue'
    import L from "leaflet"
    // import personStore
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, reactive, defineProps, onUnmounted} from 'vue'

    /**
     * @todo use person store as well
     */
    const placesStore = usePlacesStore(); 


    const props = defineProps({
        test: String,
        map: Object
    })

    let placeMarkersDistant = undefined;

    const createStationMarkersDistant = function(stations) {
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

                markers.push(marker)
            }

        }
        placeMarkersDistant = L.layerGroup(markers);

    }

    const showPlacesLayerDistant = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePlacesLayerDistant = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    onMounted(async () => {
        console.log('Places view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        if (!placesStore.loaded) await placesStore.readData(placesStore.pathToDataFile)
        console.log(placesStore.stations)

        if (placeMarkersDistant === undefined) createStationMarkersDistant(placesStore.stations)

        showPlacesLayerDistant(placeMarkersDistant, props.map);

    })

    

    onMounted(async () => {
        console.log('RENDERED DISTANT LAYER')
        // init loading of data into store
        // apply further logic when map is ready
    })

    onUnmounted(() => hidePlacesLayerDistant(placeMarkersDistant, props.map))

</script>
<template>
</template>