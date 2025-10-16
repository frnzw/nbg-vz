<script setup>
    import L from "leaflet";
    import 'leaflet-polylinedecorator'
    import "leaflet/dist/leaflet.css";
    import { useMapStore } from '../stores/mapStore'
    import { usePersonsStore } from '../stores/personsStore'
    import { createPersonViewLinkAndIcon } from '../mapHelpers.js'
    import {onMounted, onUnmounted, watch, ref, defineEmits} from 'vue' 
    import SearchField from './SearchField.vue'

    // ------------------------------ SOME SHARED CONSTANTS

    const personsStore = usePersonsStore();
    const mapStore = useMapStore();

    const props = defineProps({
        map: Object,
        sliderValue: Number,
        dateSliderValue: Number,
        personsSelectedFromPlace: Array
    });

    const emit = defineEmits(['place-selected', 'person-pre-selection-cleared']);

    // global layer groups that will be updated, added to / removed from map on user interaction
    let personLayerMarkers = undefined;
    let personLayerTraces = undefined;
    let personLayerPlaces = undefined;

    // constants for initializing SearchField Component as a person search
    const facetName = "Personennamen"
    let nameList = ref([])
    const selectedValues = ref(props.personsSelectedFromPlace)
 


    // ------------------------------ MAIN FUNCTIONS FOR MARKER CREATION

    // some shared constants
    const wrapperStyle = 'position: relative; width: 50px; height: 50px;'
    const iconCss = 'font-size: 28px; position: absolute; top: 0px; left: 1px'

    const createTraceMarker = function(person, station, opacity, wrapperStyle, iconCss) {

        const markerSvg = `
                        <svg viewBox="0 0 30 50" width="30" height="50" style="display: block;">
                        <path d="M15 0
                                C32 0, 32 25, 15 50
                                C-2 25, -2 0, 15 0 Z"
                                fill="#F5F5F5" fill-opacity="${opacity}" stroke-opacity="${opacity}" stroke="black" stroke-width="1"/>
                        </svg>
                        `
        const opaqueIconCss = iconCss + `; opacity: ${opacity};`

        const html = `<div style="${wrapperStyle}">`
                + markerSvg
                + `<i class="mdi mdi-human-male" style="${opaqueIconCss}"></i>`
                + '</div>'

        const icon = L.divIcon({
            className: 'custom-div-icon', 
            html:html, 
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            html: html
        });


        const marker = L.marker([station.lat, station.long], {icon: icon, title: station.stationId+person.persId})
        marker.data = {date: station.date, name:person.persId}

        if (person.persId === 'Teutsch_XX') {
            // console.log(`created marker for station: ${station.stationId} (${marker.data}):`);
            // console.log(marker);
        }

        return marker;

    }

    const createPopUpAndTooltipDate = function(marker, person, prevStation, prevStationStay, station, stay, nextStation, nextStationStay) {

        // if (person.persId === 'Genth_XX') {
        //     console.log('createPopUpAndTooltipDate:')
        //     console.log(person);
            
        // }    
        const stationDateFrom = station.stays[stay.stayIdx].dateFrom
        const stationDateTo = station.stays[stay.stayIdx].dateTo

        const datePresent = stationDateFrom === stationDateTo ? new Date(stationDateFrom).getFullYear() : new Date(stationDateFrom).getFullYear() + '-' + new Date(stationDateTo).getFullYear()
        let datePresentNext, buttonNext, iconNext, datePresentPrev, buttonPrev, iconPrev;
        if (nextStation) {
            const nextStationDateFrom = nextStation.stays[nextStationStay.stayIdx].dateFrom
            const nextStationDateTo = nextStation.stays[nextStationStay.stayIdx].dateTo
            datePresentNext = nextStationDateFrom === nextStationDateTo ? new Date(nextStationDateFrom).getFullYear() : new Date(nextStationDateFrom).getFullYear() + '-' + new Date(nextStationDateTo).getFullYear();
            [buttonNext, iconNext] = createPlaceViewLinkAndIcon(nextStation.stationId);
        }
        if (prevStation) {
            const prevStationDateFrom = prevStation.stays[prevStationStay.stayIdx].dateFrom
            const prevStationDateTo = prevStation.stays[prevStationStay.stayIdx].dateTo
            datePresentPrev = prevStationDateFrom === prevStationDateTo ? new Date(prevStationDateFrom).getFullYear() : new Date(prevStationDateFrom).getFullYear() + '-' + new Date(prevStationDateTo).getFullYear();
            [buttonPrev, iconPrev] = createPlaceViewLinkAndIcon(prevStation.stationId);
        }

        const popupDiv = document.createElement('div');

        const heading = document.createElement('h3')
        heading.textContent = `${person.persId} : ${marker.data.stationIdx} (${!datePresent ? 'keine Daten' :  datePresent})`
        
        const subHeadingCurrent = document.createElement('b')
        subHeadingCurrent.textContent = 'Letzte (erfasste) Station aus NBG-VZ:'

        const [buttonCurrent, iconCurrent] = createPlaceViewLinkAndIcon(station.stationId)

        const subHeadingPrev = document.createElement('b')
        subHeadingPrev.textContent = 'Vorherige (erfasste) Station aus NBG-VZ:'

        const subHeadingNext = document.createElement('b')
        subHeadingNext.textContent = 'Nächste (erfasste) Station aus NBG-VZ:'
        
        popupDiv.appendChild(heading);
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(subHeadingCurrent);
        popupDiv.appendChild(document.createElement('br'));
        if (datePresent) {
            popupDiv.appendChild(document.createTextNode(`${datePresent}: `));
            popupDiv.appendChild(buttonCurrent);
            popupDiv.appendChild(iconCurrent);
        } else {
            popupDiv.appendChild(document.createTextNode('keine Daten'));
        }
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(subHeadingPrev);
        popupDiv.appendChild(document.createElement('br'));
        if (datePresentPrev) {
            popupDiv.appendChild(document.createTextNode(`${datePresentPrev}: `));
            popupDiv.appendChild(buttonPrev);
            popupDiv.appendChild(iconPrev);
        } else {
            popupDiv.appendChild(document.createTextNode('keine Daten'));
        }
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(subHeadingNext);
        popupDiv.appendChild(document.createElement('br'));
        if (datePresentNext) {
            popupDiv.appendChild(document.createTextNode(`${datePresentNext}: `));
            popupDiv.appendChild(buttonNext);
            popupDiv.appendChild(iconNext);
        } else {
            popupDiv.appendChild(document.createTextNode('keine Daten'));
        }

        const subHeadingPerson = document.createElement('b');
        subHeadingPerson.textContent = 'Zur Person:';

        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(document.createElement('br'));
        popupDiv.appendChild(subHeadingPerson);
        popupDiv.appendChild(document.createElement('br'));
        if (person.familyName) {
            popupDiv.appendChild(document.createTextNode(`Nachname: ${person.familyName}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.givenName) {
            popupDiv.appendChild(document.createTextNode(`Vorname: ${person.givenName}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.gender) {
            popupDiv.appendChild(document.createTextNode(`Gender: ${person.gender}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.birthName) {
            popupDiv.appendChild(document.createTextNode(`geboren: ${person.birthName}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.widowed) {
            popupDiv.appendChild(document.createTextNode(`verwitwet: ${person.widowed}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.choir) {
            popupDiv.appendChild(document.createTextNode(`Chor: ${person.choir}`));
            popupDiv.appendChild(document.createElement('br'));
        }
        if (person.wdId) {
            const [a, icon] = createWikidataLinkAndIcon(person.wdId)
            popupDiv.appendChild(document.createTextNode('Wikidata: '));
            popupDiv.appendChild(a);
            popupDiv.appendChild(icon)
            popupDiv.appendChild(document.createElement('br'));

        }
        // popupDiv.appendChild(button);

        marker.bindPopup(popupDiv);
        marker.bindTooltip(`${person.persId}`)

    }

    const createWikidataLinkAndIcon = function(wdId) {
        const a = document.createElement('a');
        const linkText = document.createTextNode(wdId);
        a.appendChild(linkText);
        a.title = 'Link to Wikidata Page';
        a.href = `https://www.wikidata.org/wiki/${wdId}`;
        a.target = '_blank';
        const icon = document.createElement('i');
        icon.classList.add('mdi', 'mdi-open-in-new');
        icon.style.paddingLeft = '3px'

        return [a, icon]
    }

    const createPlaceViewLinkAndIcon = function(stationId) {
        const button = document.createElement('button');
        button.style.color = '#0078A8';            
        button.style.textDecoration = 'underline';
        button.title ='View Place in Place View';
        button.textContent = `${stationId}`;
        button.onclick = async function() {
            console.log(`Clicked on ${stationId}`);
            emit('place-selected', stationId)
        }

        const icon = document.createElement('i');
        icon.classList.add('mdi', 'mdi-map-marker');
        icon.style.paddingLeft = '3px';

        return [button, icon]
    }


    const createMarkersAndArrowTraces = function(orderedStationsAggr, groupedStationsAggr, person, markers, traces, wrapperStyle, iconCss) {
        let check = ''

        // if (person.persId === 'Teutsch_XX') console.log(`${person}`);
        for (let i = 0; i < orderedStationsAggr.length; i += 1) {

            const station = groupedStationsAggr.filter(s => s.stationId === orderedStationsAggr[i].stationId)[0]
            // find previous and next station
            // ! next station is not in filtered values!
            const nextStation = person.orderedStationsAggr[i+1] ? person.groupedStationsAggr[person.orderedStationsAggr[i+1].stationId] : undefined;
            const nextStationStay = person.orderedStationsAggr[i+1];
            const prevStation = person.orderedStationsAggr[i-1] ? person.groupedStationsAggr[person.orderedStationsAggr[i-1].stationId] : undefined;
            const prevStationStay = person.orderedStationsAggr[i-1]

            const placeMarkerOpacity = person.orderedStationsAggr.length > 0 ? 1 / person.orderedStationsAggr.length : undefined
            // only create marker for most current station
            if (i === orderedStationsAggr.length - 1) {
                const stay = orderedStationsAggr[i]
                // console.log(`stay: ${JSON.stringify(stay)}`);

                // console.log(`station: ${station}`);
                const marker = createTraceMarker(person, station, 1, wrapperStyle, iconCss);
                marker.data = {dateFrom: station.dateFrom, dateTo: station.dateTo, name:person.persId, stationIdx: `${orderedStationsAggr[i].stationId}_${orderedStationsAggr[i].stayIdx}`};

                if (person.persId === 'Teutsch_XX') {
                    // console.log(`previous station: ${(prevStation) ? prevStation.stationId : undefined}`);
                    // console.log(`station: ${station.stationId}`);
                    // console.log(station);
                    // console.log(`next station id index: ${i+1}; orderedStationsAggr.length: ${orderedStationsAggr.length}`);
                    // console.log(`next station: ${(nextStation) ? nextStation.stationId : undefined}`);
                }

                createPopUpAndTooltipDate(marker, person, prevStation, prevStationStay, station, stay, nextStation, nextStationStay);
                markers.push(marker);
            } else {
                // create regular place marker with simple tooltip / popup
                const circle = L.circle([station.lat, station.long], {
                    color:'red',
                    fillColor: '#f03',
                    fillOpacity: placeMarkerOpacity,
                    opacity: placeMarkerOpacity,
                    radius: mapStore.markerBaseSize * (20 - props.map.getZoom())
                });
                circle.data = {name: person.persId}
                circle.bindTooltip(station.stationId)

                const [button, icon] = createPlaceViewLinkAndIcon(station.stationId)
                const popupDiv = document.createElement('div');
                popupDiv.appendChild(button);
                popupDiv.appendChild(icon);
                circle.bindPopup(popupDiv)

                traces.push(circle);
            }

            // opacity of traces calculated from total number of station changes
            const nofChanges = person.orderedStationsAggr.length - 1;
            const traceOpacity = nofChanges > 0 ? 1 / nofChanges : undefined
            if (person.persId === 'Teutsch_XX') {
                console.log(`nofChanges: ${JSON.stringify(person.orderedStationsAggr)}:`);
                console.log(`nofChanges: ${nofChanges}:`);
                console.log(`traceOpacity: ${traceOpacity}:`);        
            }
            // create traces for all changes of station
            if (nofChanges > 0 && i < orderedStationsAggr.length - 1) {
                // if (person.persId === 'Teutsch_XX') {
                //     console.log(`line to: ${nextStation.stationId}:`);
                //     // check += `${station.stationId}-->`
                    
                // }
                const from = [station.lat, station.long]
                const to = [nextStation.lat, nextStation.long]
                const line = L.polyline([from, to], {color: 'black', opacity: traceOpacity})
                const arrowHead = L.polylineDecorator(line, {
                    patterns: [
                        {offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 25, polygon: false, pathOptions: {stroke: true, color: 'black', opacity:traceOpacity}})}
                    ]
                });
                const arrow = L.layerGroup([line, arrowHead]);
                arrow.data = {name:person.persId, fromStation:station.stationId, toStation:nextStation.stationId}
                traces.push(arrow)
            }
            if (i === orderedStationsAggr.length - 1) check += station.stationId
        }

        // if (person.persId === 'Teutsch_XX') {
        //                     console.log(`person.stations:`);
        //                     console.log(person.stations);
        //                     console.log(`check:`);
        //                     console.log(check);
        //                 }
    }

    const  createPersonMarkersDate = function(persons, wrapperStyle, iconCss) {
        // console.log("Attempting to add " + Object.keys(persons).length + " per son markers")
        const personMarkers = [];
        const personTraces = [];
        const placeMarkers = [];

        // ------ iterate over persons from store

        for (const key of Object.keys(persons)) {
            if (!key) continue

            const person = persons[key];

            // ------ find every station entry the person has up to the currently selected slider value
            // ------ & find dated entry for person that is the next smaller or equal to slider value
            const [stationsTillSelected, stationsIdsTillSelected] = findStationsTillSelectedAggr(person)
            if (person.persId === 'Teutsch_XX') {
                console.log(`stationsTillSelectedX: ${stationsTillSelected}`);
            }

            // ------- filter out person-place entries with dates higher than slider value

            if (props.dateSliderValue >= person.sortedDates[0]) {


                // console.log(`props.dateSliderValue: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                // console.log(`person.sortedDates[0]: ${person.sortedDates[0]} = ${new Date(person.sortedDates[0]).toDateString()}`);
                // console.log(`stationsTillSelected.length = ${stationsTillSelected.length}; opacityStep = ${opacityStep}`)
                // console.log(person.sortedDates)
                // if (person.persId === 'Teutsch_XX') {
                //             console.log(`selected date: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                // }



                // if (person.persId === 'Teutsch_XX') {
                //     console.log(`stations till selected date: ${JSON.stringify(stationsTillSelected)}`);
                // }

                // aggregate stations further
                // const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(stationsTillSelected, person)

                const orderedStationsAggr = stationsIdsTillSelected;
                const groupedStationsAggr = stationsTillSelected;
                if (person.persId === 'Teutsch_XX') {
                    console.log('reduced aggregated stations per person:')
                    console.log(orderedStationsAggr)
                    console.log(groupedStationsAggr)
                }

                // if (person.persId === 'Teutsch_XX') {
                //     console.log(`grouped stations ${orderedStationsAggr}:`);
                //     console.log(groupedStationsAggr);
                //     console.log(`length grouped stations: ${orderedStationsAggr.length} opacity step ${opacityStep}`);
                // }

                // create markers and polylines
                const markers = []
                const traces = []
                const places = []
                createMarkersAndArrowTraces(orderedStationsAggr, groupedStationsAggr, person, markers, traces, places, wrapperStyle, iconCss)


                markers.forEach(m => personMarkers.push(m))
                traces.forEach(t => personTraces.push(t))
                places.forEach(p => placeMarkers.push(p))

                // console.log(`length markers ${person.persId}: ${markers.length}`);
                // console.log(`length traces ${person.persId} : ${traces.length}`);

                // if (person.persId === 'Teutsch_XX') {
                //     console.log(markers);
                // }
            }

        }
   
        // console.log(`length markers total: ${personMarkers.length}`);
        // console.log(`length traces total: ${personTraces.length}`);
        // console.log(personMarkers)
        // console.log(personTraces)

        // filter station by selected names
        const [markersFilteredName, tracesFilteredName, placesFilteredName] = filterByNames(selectedValues.value, personMarkers, personTraces, placeMarkers)

        // create layer groups from initial markers
        console.log(markersFilteredName)
        console.log(tracesFilteredName)
        personLayerMarkers = L.layerGroup(markersFilteredName);
        personLayerTraces = L.layerGroup(tracesFilteredName)
        personLayerPlaces = L.layerGroup(placesFilteredName)

        // console.log('markers added to layergroup')

    }

    // ------------------------------ FILTER FUNCTIONS

    const filterByNames = function(selectedValues, markers, traces, places) {

        const markersFilteredName = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.name))
        const tracesFilteredName = selectedValues.length == 0 ? traces : traces.filter(trace => selectedValues.includes(trace.data.name))
        const placesFilteredName = selectedValues.length == 0 ? traces : places.filter(place => selectedValues.includes(place.data.name))
        // console.log(filteredByNames)
        // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return [markersFilteredName, tracesFilteredName, placesFilteredName]
    }

    const findLastKnownChoir = function(person) {
        let lastKnownChoir, lastRecordedDate;
        for (const key of Object.keys(person.choirDate)) {
            const entry = person.choirDate[key]
            if (entry.date.getTime() < props.dateSliderValue) {
                continue;
            } else if (entry.date.getTime() === props.dateSliderValue) {
                lastKnownChoir = entry.choir;
                lastRecordedDate = entry.date;
            } else {
                if (person.sortedDates.length === 1) break
                const dateBeforeIdx = person.sortedDates.indexOf(key) - 1;
                lastKnownChoir = person.choirDate[dateBeforeIdx].choir;
                lastRecordedDate = person.choirDate[dateBeforeIdx].date;

            }
        }

        return [lastKnownChoir, lastRecordedDate];
    }

    const findStationsTillSelectedAggr = function(person) {

        // if (person.persId === 'Teutsch_XX') console.log(`orderedStationsAggr: ${person.orderedStationsAggr}`);
        const stationsTillSelected = [];
        const stationsIdsTillSelected = [];

        // go over groupedStationsAggr in order of orderedStationsAggr
        for (let i = 0; i < person.orderedStationsAggr.length; i += 1) {

            if (stationsIdsTillSelected.includes(person.orderedStationsAggr[i])) {
                stationsIdsTillSelected.push(person.orderedStationsAggr[i]); // still push to list for tracing path in order
                continue;
            } // station was already selected for previous stay

            const stationId = person.orderedStationsAggr[i].stationId
            const stayIdx = person.orderedStationsAggr[i].stayIdx
            const station = person.groupedStationsAggr[stationId]
            const ts = station.stays[stayIdx].dateFrom

            // if (person.persId === 'Teutsch_XX') console.log(`stay: ${JSON.stringify(person.orderedStationsAggr[i])}`);
            // if (person.persId === 'Teutsch_XX') console.log(`station: ${station.stationId}`);
            // if (person.persId === 'Teutsch_XX') console.log(`stay from: ${ts}`);

            // if a stay with dateFrom <= sliderValue is found: add to stationsTillSelected
            if (ts < props.dateSliderValue) {
                if (person.persId === 'Teutsch_XX') console.log(`date ${new Date(ts).toDateString()} < slider ${new Date(props.dateSliderValue).toDateString()}`)    

                stationsTillSelected.push(station);
                stationsIdsTillSelected.push(person.orderedStationsAggr[i]);
                // if (person.persId === 'Teutsch_XX') console.log(`added station, moving to next station`);


                    // if (person.persId === 'Teutsch_XX') console.log(`index i in ordered stations: ${i}`);
                    // if (person.persId === 'Teutsch_XX') console.log(`person.orderedStationsAggr.length - 1: ${person.orderedStationsAggr.length - 1}`);
                    if (i === person.orderedStationsAggr.length - 1) {
                        // if (person.persId === 'Teutsch_XX') console.log('stay is last stay in persons stations');
                        break;
                    }
                    
                    
                } else if (ts === props.dateSliderValue) {
                    // if (person.persId === 'Teutsch_XX') console.log(`date ${new Date(ts).toDateString()} === slider ${new Date(props.dateSliderValue).toDateString()}`)

                    stationsTillSelected.push(station);
                    stationsIdsTillSelected.push(person.orderedStationsAggr[i]);

                    // if (person.persId === 'Teutsch_XX') console.log(`added station, moving to next station`);
                    break;
                } else {
                    break; // since stays are ordered, there should be no earlier stay listed after the first one after the selected time
                }
            
        
            }

        return [stationsTillSelected, stationsIdsTillSelected]

    }


    // ------------------------------ UPDATE FUNCTIONS

    /**
     * In the persons view, markers represent a person. Therefore, if the year changes, a markers
     * position may have to be updated according to the slider value. Since markers / polylines cannot be created without lat/long,
     * 'keeping' and updating empty markers is not possible. Instead, the watch function on slider value and the
     * onSelectedNamesUpdate function have to create all markers for persons which have a location for 
     * the respective year, clear the layer and attach the new markers.
     * 
     * This already implies filtering by year, after which only filtering by name has to happen. 
     */

    watch(() => props.dateSliderValue, () => {
        console.log('triggered watch for slider!')
        if (personLayerMarkers && personLayerTraces) {
            console.log('old layers present')
            // console.log(selectedValues.value)
            personLayerMarkers.clearLayers() // apparently critical for slider performance to do this before creating new markers...?
            personLayerTraces.clearLayers()
            personLayerPlaces.clearLayers()

            createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);
            showPersonsLayer(personLayerMarkers, personLayerTraces, personLayerPlaces, props.map);
  

        }    

    })

    const onSelectedNamesUpdate = function (currentlySelectedValues) {
        // clear pre-selection prop in map component to avoid pre-selection being active next time
        // a user navigates here via tabs
        emit('person-pre-selection-cleared')
        if (personLayerMarkers && personLayerTraces && personLayerPlaces) {
            console.log('On selected names update:')
            console.log(currentlySelectedValues)
            console.log(selectedValues) 
            // console.log(personMarkers)
            if (true) {
                    console.log('layers before onSelectedNamesUpdate:')
                    console.log(personLayerMarkers.getLayers())
                    console.log(personLayerTraces.getLayers())
                }
            personLayerMarkers.clearLayers()
            personLayerTraces.clearLayers()
            personLayerPlaces.clearLayers()
            console.log('removed markers')

            createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);
            if (true) {
                    console.log('layers after onSelectedNamesUpdate:')
                    console.log(personLayerMarkers.getLayers())
                    console.log(personLayerTraces.getLayers())
                }
            showPersonsLayer(personLayerMarkers, personLayerTraces, personLayerPlaces, props.map);

        }
    }



    const showPersonsLayer = function(markerLayerGroup, traceLayerGroup, personLayerPlaces, map) {
        markerLayerGroup.addTo(map)
        traceLayerGroup.addTo(map)
        personLayerPlaces.addTo(map)
    }

    const hidePersonsLayer = function(markerLayerGroup, traceLayerGroup, personLayerPlaces, map) {
        markerLayerGroup.removeFrom(map)
        traceLayerGroup.removeFrom(map)
        personLayerPlaces.removeFrom(map)

    }


    // ------------------------------ COMPONENT LIFECYCLE FUNCTIONS

    onMounted(async () => {
        console.log('RENDERED PERSONS LAYER')
        //console.log('Person view map prop: ');
        //console.log(props.map);

        if (!personsStore.loaded) await personsStore.readData(personsStore.pathToDataFilePersons, personsStore.pathToDataFilePersonsPlaces)

        console.log('personsStore.persons:')
        console.log(personsStore.persons)

        createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss)
        nameList.value = Array.from(Object.keys(personsStore.persons))
        // console.log('nameList from person store:')
        // console.log(nameList.value)

        console.log(`props.personsSelectedFromPlace: ${props.personsSelectedFromPlace}`);
        // selectedValues.value = [props.persId]
        console.log(`mounting with selected values: ${selectedValues.value}`)
        showPersonsLayer(personLayerMarkers, personLayerTraces, personLayerPlaces, props.map);


    })

    onUnmounted(() => hidePersonsLayer(personLayerMarkers, personLayerTraces, personLayerPlaces, props.map))


</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>




  