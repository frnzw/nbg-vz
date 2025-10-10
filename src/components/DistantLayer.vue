<script setup>
    import Map from './Map.vue'
    import L from "leaflet"
    // import personStore
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, watch, defineProps, onUnmounted} from 'vue'

    /**
     * @todo use person store as well
     */
    const placesStore = usePlacesStore(); 


    const props = defineProps({
        map: Object,
        dateSliderValue: Number
    });

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


    // Animationsfunktion
    function animateMarker(time, marker, startLatLng, endLatLng, duration, startTime) {
        const t = (time - startTime) / duration; // Fortschritt 0..1

        if (t >= 1) {
            marker.setLatLng(endLatLng); // am Ende
            return;
        }

        // 1. LatLng in Pixelkoordinaten umwandeln
        const startPoint = props.map.latLngToLayerPoint(startLatLng);
        const endPoint   = props.map.latLngToLayerPoint(endLatLng);

        // 2. Linear interpolieren
        const currentPoint = L.point(
            startPoint.x + (endPoint.x - startPoint.x) * t,
            startPoint.y + (endPoint.y - startPoint.y) * t
        );

        // 3. Zurück in LatLng
        const currentLatLng = props.map.layerPointToLatLng(currentPoint);

        // 4. Marker setzen
        marker.setLatLng(currentLatLng);

        // 5. nächsten Frame anfordern
        requestAnimationFrame((t) => animateMarker(t, marker, startLatLng, endLatLng, duration, startTime));
    }

    const testNativeMovingMarker = async function(startLatLng, endLatLng) {
        // make a polyline for testing


        // const testLineMedium = L.polyline([[40.730610, -73.935242], [5.839398, -55.199089]]) // nyc -> paramaribo
        // const testLineLong = L.polyline([[40.730610, -73.935242], [48.864716, 2.349014]]) // nyc -> paris
        // const testLineShort = L.polyline([[40.730610, -73.935242], [42.361145, -71.057083]]) // nyc -> boston

        const marker = L.marker(startLatLng)
        marker.addTo(props.map)
        // Dauer der Animation in Millisekunden
        const duration = 1000;

        // Startzeit merken
        const startTime = performance.now();

        // Animation starten
        requestAnimationFrame((t) => animateMarker(t, marker, startLatLng, endLatLng, duration, startTime));

    }

    const moveMarkers = function() {
        const newYork = [40.730610, -73.935242]
        const paramaribo = [5.839398, -55.199089]
        const boston = [42.361145, -71.057083]
        const paris = [48.864716, 2.349014]

        testNativeMovingMarker(newYork, paramaribo);
        testNativeMovingMarker(newYork, boston);
        testNativeMovingMarker(newYork, paris);

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

        moveMarkers();

    })

    onUnmounted(() => hidePlacesLayerDistant(placeMarkersDistant, props.map))

    watch(() => props.dateSliderValue, () => {
        console.log('triggered watch for slider!')
        moveMarkers();   

    })

</script>
<template>
</template>