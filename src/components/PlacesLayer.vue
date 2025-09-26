<script setup>
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
    const markerBaseSize = 500

    const createStationMarkers = function(stations) {
        // console.log("Attempting to add " + Object.keys(stations).length + " markers")
        placeMarkers = []

        // console.log('resizing markers for slidervalue: ' + props.sliderValue)
        for (const key of Object.keys(stations)) {
            if (!key) continue
            if (stations.hasOwnProperty(key)) {
                //console.log(key)
                
                const station = stations[key]
                //console.log(key, station)
           
                // console.log('station.persons[sliderValue]: ' + station.persons[props.sliderValue])
                // console.log('markerBaseSize: ' + markerBaseSize)
                const radiusScaled = station.persons[props.sliderValue] ? markerBaseSize * parseInt(station.persons[props.sliderValue].count) : markerBaseSize
                // console.log('radius scaled: ' + radiusScaled)
                const circle = L.circle([station.lat, station.long], {
                    color: station.persons[props.sliderValue] ? 'red' : 'grey',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: radiusScaled * (20 - props.map.getZoom()) * 10000
                })

                circle.data = {stationId:station.stationId, persons:station.persons}


                let popUpHtml = `<h3>${station.stationId}</h3></br>`
                                + `<b>Anwesend laut NBG-Verzeichnis (${station.persons[props.sliderValue] ? station.persons[props.sliderValue].count : 'keine Daten'}):</b></br>`

                if (station.persons[props.sliderValue]) {
                    for (const p of station.persons[props.sliderValue].persons) {
                        popUpHtml = popUpHtml + `${p.persId} (${p.choir})</br>`
                    }
                }
                
                circle.bindPopup(popUpHtml);
                circle.bindTooltip(`${station.stationId}`)

                placeMarkers.push(circle)
            }

        }
        const filtered = applyFilters(props.sliderValue, selectedValues.value, placeLayer, placeMarkers)
        placeLayer = L.layerGroup(filtered);
        placeLayer.addTo(props.map)
        // console.log('markers added to layergroup')
        

    }

        const resizeMarker = function(marker, year) {
            const radiusScaled = marker.data.persons[year] ? markerBaseSize * parseInt(marker.data.persons[year].count) : markerBaseSize;
            marker.setRadius(radiusScaled * (20 - props.map.getZoom())) * 10000;
            marker.setStyle({color: marker.data.persons[year] ? 'red' : 'grey'});
        }

        const updatePopUpContent = function(marker, year) {
            let popUpHtml = `<h3>${marker.data.stationId}</h3></br>`
                                + `<b>Anwesend laut NBG-Verzeichnis (${marker.data.persons[year] ? marker.data.persons[year].count : 'keine Daten'}):</b></br>`

            if (marker.data.persons[year]) {
                for (const p of marker.data.persons[year].persons) {
                    popUpHtml = popUpHtml + `${p.persId} (${p.choir})</br>`
                }
            }

            marker.setPopupContent(popUpHtml)
        }

        const updateMarkers = function(markers, year) {
            markers.forEach((marker) => {
                resizeMarker(marker, year)
                updatePopUpContent(marker, year)

            });

        }

        const applyFilters = function(sliderValue, selectedValues, layer) {
                if (layer) layer.clearLayers()
                // console.log('removed markers')

                // const filteredByYear = placeMarkers.filter(marker => marker.data.year === sliderValue)
                // console.log(`Filtered markers for year ${sliderValue}: ${filteredByYear.length}`)
                const filteredByYear = placeMarkers
                // console.log(`Not yet filtering markers for year.`)
                // console.log(typeof(selectedValues))
                // console.log(selectedValues)
                const filteredByNames = selectedValues.length == 0 ? filteredByYear : filteredByYear.filter(marker => selectedValues.includes(marker.data.stationId))
                // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

                updateMarkers(filteredByNames, props.sliderValue)

                
                return filteredByNames
        }

        /**
         * In the places view, markers represent places. Therefore, if the year changes, a markers
         * radius may have to be updated according to the slider value. Since markers are created with a standard radius if no data 
         * is present for the respective date, they do not need to be recreated.
         * Instead, the watch function on slider value filters the list of all place markers for date and names,
         * clear the layer and attach the filtered markers.
         */
        watch(() => props.sliderValue, (sliderValue) => {
                // console.log('triggered watch for slider!')
                if (placeMarkers && placeLayer) {
                    // console.log(selectedValues.value)
                    const filtered = applyFilters(sliderValue, selectedValues.value, placeLayer, placeMarkers)
                    filtered.forEach(marker => marker.addTo(placeLayer))

                }

            })

        const onSelectedNamesUpdate = function (selectedValues, sliderValue, personLayer, personMarkers) {
            if (placeMarkers && placeLayer) {
                // console.log('On selected names update:')
                // console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
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
        // console.log('Places view test prop: ' + props.test);
        // console.log('Places view map prop: ');
        // console.log(props.map);
        // console.log('pathToDataFile: ' + placesStore.pathToDataFile)
        await placesStore.readData(placesStore.pathToDataFile)
        // console.log(placesStore.stations)

        if (placeMarkers === undefined) createStationMarkers(placesStore.stations, props.map)
        // console.log(Object.keys(placesStore.stations))
        nameList.value = Array.from(Object.keys(placesStore.stations))
        // console.log(nameList.value)

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