<script setup>
    import Map from './Map.vue'
    import L from "leaflet"
    import { usePersonsStore } from '../stores/personsStore'
    import { usePlacesStore } from '../stores/placesStore'
    import {onMounted, watch, defineProps, onUnmounted} from 'vue'

    // ----------------- Setup / Component Scope Constants -------------------------
    const placesStore = usePlacesStore();
    const personsStore = usePersonsStore();

    const props = defineProps({
        map: Object,
        dateSliderValue: Number
    });

    let allPlaceMarkers = undefined;
    let placeLayer = undefined;

    const markerBaseSize = 500

    // ----------------- Hardcoded Markers for Testing -------------------------
    const newYork = [40.730610, -73.935242]
        const paramaribo = [5.839398, -55.199089]
        const boston = [42.361145, -71.057083]
        const paris = [48.864716, 2.349014]

        const persCountNewYork = 100;
        const markerNewYork = L.circle(newYork, {
            color:  'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: markerBaseSize * persCountNewYork * (20 - props.map.getZoom())
        });
        markerNewYork.data = { persCount: persCountNewYork, name: 'New york'}
        markerNewYork.addTo(props.map)

        const persCountParis = 3;
        const markerParis = L.circle(paris, {
            color:  'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: markerBaseSize * persCountParis * (20 - props.map.getZoom())
        });
        markerParis.data = { persCount: persCountParis, name: 'Paris'}
        markerParis.addTo(props.map)

        const persCountParamaribo = 5;
        const markerParamaribo = L.circle(paramaribo, {
            color:  'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: markerBaseSize * persCountParamaribo * (20 - props.map.getZoom())
        });
        markerParamaribo.data = { persCount: persCountParamaribo, name: 'Paramaribo'};
        markerParamaribo.addTo(props.map);

        const persCountBoston = 5;
        const markerBoston = L.circle(boston, {
            color:  'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: markerBaseSize * persCountBoston * (20 - props.map.getZoom())
        });
        markerBoston.data = { persCount: persCountBoston, name: 'Boston'};
        markerBoston.addTo(props.map);


    // ----------------- Filtering and Updating -------------------------
    
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

    const getPersonsCurrentAndPreviousStation = function(person) {
        let lastRecordPosition;
        let lastRecordedDate;
        let lastStationBeforeSelectedTime;

        let previousRecordedDate;
        let previousStationBeforeSelectedTime;

        for (const ts of person.sortedDates) {

            if (ts < props.dateSliderValue) {
                continue;
            } else if (ts === props.dateSliderValue) {
                lastRecordPosition = person.sortedDates.indexOf(ts);
                lastRecordedDate = person.sortedDates[lastRecordPosition];
                lastStationBeforeSelectedTime = person.stationsDate[lastRecordedDate];

                if (lastRecordPosition === 0) {
                    previousStationBeforeSelectedTime = undefined;
                } else {
                    previousRecordedDate = person.sortedDates[lastRecordPosition - 1];
                    previousStationBeforeSelectedTime = person.stationsDate[previousRecordedDate];
                }

                break; 
            } else {
                // if ts > dateSliderValue but also only value? -> do not show marker
                if (person.sortedDates.length === 1) {
                    lastStationBeforeSelectedTime = undefined;
                    previousStationBeforeSelectedTime = undefined;
                } else {
                    lastRecordPosition = person.sortedDates.indexOf(ts) - 1;
                    lastRecordedDate = person.sortedDates[lastRecordPosition];
                    lastStationBeforeSelectedTime = person.stationsDate[lastRecordedDate];

                    previousRecordedDate = person.sortedDates[lastRecordPosition - 1];
                    previousStationBeforeSelectedTime = person.stationsDate[previousRecordedDate];
                }

                break;
            }
        }

        return [lastStationBeforeSelectedTime, previousStationBeforeSelectedTime];

    }



    const filterByStationId = function(selectedValues, markers) {

        const filteredByNames = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.stationId))
        // console.log(filteredByNames)
        // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return filteredByNames
    }

    // ----------------- Marker and Popup Creation -------------------------
    const createPopUpAndTooltip = function (circle, station, lastRecordedDate, lastPersonsBeforeSelectedTime) {
        
        let popUpHtml = `<h3>${station.stationId}</h3></br>`
                      + `<b>Anwesend laut letztem erfassten NBG-Verzeichnis ${lastRecordedDate ? new Date(lastRecordedDate).getFullYear() : ''} (${lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 'keine Daten'}):</b></br>`

        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = popUpHtml;


        if (lastPersonsBeforeSelectedTime) {
            for (const [index, person] of lastPersonsBeforeSelectedTime.persons.entries()) {
                const button = document.createElement('button');
                button.textContent = `${person.persId} (${person.choir})`;
                button.onclick = async function() {
                    console.log(`Clicked on ${person.persId} (${person.choir})`);
                    emit('person-selected', person.persId)
                }
                popupDiv.appendChild(button);
                if (index < lastPersonsBeforeSelectedTime.persons.length - 1) popupDiv.appendChild(document.createElement('br'));
            }

        }

        circle.bindPopup(popupDiv);
        circle.bindTooltip(`${station.stationId}`)           
        
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

        circle.data = {stationId: station.stationId, persCount: lastPersonsBeforeSelectedTime ? lastPersonsBeforeSelectedTime.count : 0}
   
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
        //const filtered = filterByStationId(selectedValues.value, placeMarkers)
        placeLayer = L.layerGroup(placeMarkers);
        allPlaceMarkers = placeMarkers;
        placeLayer.addTo(props.map)
        console.log('markers added to layergroup')
        console.log(allPlaceMarkers)

        

    }

    // ----------------- Animation -------------------------
    function animateMarker(time, persMarker, markerStart, markerEnd, duration, startTime) {

        // progress, i.e. proportion of line that should have been 
        // passed at time since animation started [0,1]
        // => e.g if animation time = 1000 ms, 500 ms passed since start => 0.5 
        // => current position is at half the distance 

        const progressOnLine = (time - startTime) / duration; 

        if (progressOnLine >= 1) {
            persMarker.setLatLng(markerEnd.getLatLng());
            // update end markers person count and radius
            markerEnd.data.persCount += 1
            console.log(`${markerEnd.data.stationId}: ${markerEnd.data.persCount}`)
            markerEnd.setRadius(updatePlaceMarkerRadius(markerEnd));
            persMarker.removeFrom(props.map)
            return; // end animation
            
        }

        // transform LatLng to pixel coordinates with native leaflet function
        const startPoint = props.map.latLngToLayerPoint(markerStart.getLatLng());
        const endPoint   = props.map.latLngToLayerPoint(markerEnd.getLatLng());

        // calculate the current position using the expected progress on the 
        // line at the current time since animation started
        const currentPoint = L.point(
            startPoint.x + (endPoint.x - startPoint.x) * progressOnLine,
            startPoint.y + (endPoint.y - startPoint.y) * progressOnLine
        );

        // transform back to LatLng coordinates with native leaflet function
        const currentLatLng = props.map.layerPointToLatLng(currentPoint);

        // update person marker with the current position
        persMarker.setLatLng(currentLatLng);

        // call animation function again
        requestAnimationFrame((progressOnLine) => animateMarker(progressOnLine, persMarker, markerStart, markerEnd, duration, startTime));
    }

    const updatePlaceMarkerRadius = function(marker) {
        if (marker.data.persCount === 0) {
            return markerBaseSize
        } else {
            return markerBaseSize * marker.data.persCount * (20 - props.map.getZoom())
        }
    }

    const testNativeMovingMarker = async function(markerStart, markerEnd) {
        
        // a temporary person marker that will be moved across the map
        const persMarker = L.circle(markerStart.getLatLng(), {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.5
        });
        persMarker.addTo(props.map)

        const duration = 500;

        const startTime = performance.now();

        // start animation
        // update start markers radius here?
        if (markerStart.data.persCount > 0) markerStart.data.persCount =  markerStart.data.persCount - 1;
        console.log(`${markerStart.data.name}: ${markerStart.data.persCount}`)
        markerStart.setRadius(updatePlaceMarkerRadius(markerStart));
        requestAnimationFrame((t) => animateMarker(t, persMarker, markerStart, markerEnd, duration, startTime));

    }

    const createNativeMovingMarker = async function(markerStart, markerEnd) {
        
        // a temporary person marker that will be moved across the map
        const persMarker = L.circle(markerStart.getLatLng(), {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.5
        });
        persMarker.addTo(props.map)

        const duration = 500;

        const startTime = performance.now();

        // start animation
        // update start markers radius here?
        if (markerStart.data.persCount > 0) markerStart.data.persCount =  markerStart.data.persCount - 1;
        console.log(`${markerStart.data.stationId}: ${markerStart.data.persCount}`)
        markerStart.setRadius(updatePlaceMarkerRadius(markerStart));
        requestAnimationFrame((t) => animateMarker(t, persMarker, markerStart, markerEnd, duration, startTime));

    }

    const moveMarkers = function() {

        testNativeMovingMarker(markerNewYork, markerParamaribo);
        testNativeMovingMarker(markerNewYork, markerBoston);
        testNativeMovingMarker(markerNewYork, markerParis);

    }

    // ----------------- Lifecycle Functions -------------------------
    const showPlacesLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePlacesLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    onMounted(async () => {
        console.log('RENDERED DISTANT LAYER')
        console.log('Distant view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        if (!placesStore.loaded) await placesStore.readData(placesStore.pathToDataFile);
        if (!personsStore.loaded) await personsStore.readData(personsStore.pathToDataFile);

        console.log(placesStore.stations)

        if (allPlaceMarkers === undefined) createStationMarkersDate(placesStore.stations, props.map)

        showPlacesLayer(placeLayer, props.map);

        //moveMarkers();

    })

    onUnmounted(() => hidePlacesLayer(placeLayer, props.map));

    watch(() => props.dateSliderValue, () => {
        console.log('triggered watch for slider!')
        for (const key of Object.keys(personsStore.persons)) {
            if (!key) continue
            const person = personsStore.persons[key];
            const [currentStation, previousStation] = getPersonsCurrentAndPreviousStation(person);

            if (!previousStation) continue; // if person has np previous recorded place, go to next person

            if (person.personId === 'Teutsch_XX') {
                console.log(previousStation.stationId, currentStation.stationId);
            }

            

            // if person has changed place, trigger animation
            if (previousStation.stationId != currentStation.stationId) {

                // get the actual markers for the previous and the next station
                // this would be easier with a hashmap built upon initial marker creation
                let currentMarker;
                let previousMarker;
                for (const m of allPlaceMarkers) {
                    if (m.data.stationId === previousStation.stationId) previousMarker = m;
                    if (m.data.stationId === currentStation.stationId) currentMarker = m;
                }

                if (person.personId === 'Teutsch_XX') {
                    console.log(previousMarker.data);
                    console.log(currentMarker.data);
                    // createNativeMovingMarker(previousMarker, currentMarker)
                }
                createNativeMovingMarker(previousMarker, currentMarker);


            }
        }
           

    });

</script>
<template>
</template>