<script setup>
    import Map from './Map.vue'
    import L from "leaflet"
    // import personStore
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, reactive, defineProps, onUnmounted} from 'vue'
    import { GreatCircle } from 'arc';

    /**
     * @todo use person store as well
     */
    const placesStore = usePlacesStore(); 


    const props = defineProps({
        map: Object,
        sliderValue: Number
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


    const testNativeMovingMarker = async function() {
        // make a polyline for testing
        const newYork = [40.730610, -73.935242]
        const paramaribo = [5.839398, -55.199089]
        const boston = [42.361145, -71.057083]

        const testLineMedium = L.polyline([[40.730610, -73.935242], [5.839398, -55.199089]]) // nyc -> paramaribo
        const testLineLong = L.polyline([[40.730610, -73.935242], [48.864716, 2.349014]]) // nyc -> paris
        const testLineShort = L.polyline([[40.730610, -73.935242], [42.361145, -71.057083]]) // nyc -> boston

        // extract lat/long pairs from polyline for the whole path??
        console.log(testLineMedium)
        // else: calculate them somehow?

        // watch out for required coordinate format: lat = y, long = x
        const generator = new GreatCircle({x: newYork[1], y:newYork[0]}, {x: paramaribo[1], y:paramaribo[0]}, {'name': 'nyc to paramaribo'})
        const line = generator.Arc(2000, {offset: 10});

        // convert back to leaflet [lat, long] format
        const coords = line.geometries[0].coords.map(([long, lat]) => [lat, long])
        console.log(coords);
        // make a marker at starting point of polyline
        const marker = L.marker(newYork);
        
        marker.addTo(props.map)
        console.log(marker);
        for (const [index, c] of coords.entries()) {
            marker.setLatLng(c);
            await new Promise((resolve) => {
                console.log(`moved to coord ${index}`)
                setTimeout(resolve, 0)
            })
        }

        // try resetting lat/long of marker in 100ms intervall -> speed dependent on length of polyline would be better later

    }


    onMounted(async () => {
        console.log('RENDERED DISTANT LAYER')
        console.log('Distant view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        if (!placesStore.loaded) await placesStore.readData(placesStore.pathToDataFile)
        console.log(placesStore.stations)

        if (placeMarkersDistant === undefined) createStationMarkersDistant(placesStore.stations)

        //showPlacesLayerDistant(placeMarkersDistant, props.map);

        testNativeMovingMarker();

    })

    

    onUnmounted(() => hidePlacesLayerDistant(placeMarkersDistant, props.map))

</script>
<template>
</template>