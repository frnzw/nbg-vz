<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import 'leaflet-polylinedecorator'
    import "leaflet/dist/leaflet.css";
    import { usePersonsStore } from '../stores/personsStore'
    import {onMounted, onUnmounted, watch, ref} from 'vue' 
    import SearchField from './SearchField.vue'

    const personsStore = usePersonsStore();

    const props = defineProps({
        map: Object,
        sliderValue: Number,
        dateSliderValue: Number
    })



    let currentPersonMarkers = undefined;
    let currentPersonTraces = undefined;
    let personLayerMarkers = undefined;
    let personLayerTraces = undefined;


    const facetName = "Personennamen"
    let nameList = ref([])
    const selectedValues = ref([])
 
    const wrapperStyle = 'position: relative; width: 50px; height: 50px;'

    const markerSvg = `
    <svg viewBox="0 0 30 50" width="30" height="50" style="display: block;">
    <path d="M15 0
            C32 0, 32 25, 15 50
            C-2 25, -2 0, 15 0 Z"
            fill="#F5F5F5" fill-opacity="0.9" stroke="black" stroke-width="1"/>
    </svg>
    `

    const iconCss = 'font-size: 28px; position: absolute; top: 0px; left: 1px'

    const html = `<div style="${wrapperStyle}">`
                + markerSvg
                + `<i class="mdi mdi-human-male" style="${iconCss}"></i>`
                + '</div>'


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


        const marker = L.marker([station.lat, station.long], {icon: icon, title: station.stationId+person.personId})
        marker.data = {date: station.date, name:person.personId}

        if (person.personId === 'Teutsch_XX') {
            console.log(`created marker for station: ${station.stationId} (${marker.data}):`);
            console.log(marker);
        }

        return marker;

    }




const createPopUpAndTooltipDate = function(marker, person, prevStation, prevStationStay, station, stay, nextStation, nextStationStay) {

    // if (person.personId === 'Genth_XX') {
    //     console.log('createPopUpAndTooltipDate:')
    //     console.log(person);
        
    // }    
    const stationDateFrom = station.stays[stay.stayIdx].dateFrom
    const stationDateTo = station.stays[stay.stayIdx].dateTo

    const datePresent = stationDateFrom === stationDateTo ? new Date(stationDateFrom).getFullYear() : new Date(stationDateFrom).getFullYear() + '-' + new Date(stationDateTo).getFullYear()
    let datePresentNext, datePresentPrev;
    if (nextStation) {
        const nextStationDateFrom = nextStation.stays[nextStationStay.stayIdx].dateFrom
        const nextStationDateTo = nextStation.stays[nextStationStay.stayIdx].dateFrom
        datePresentNext = nextStationDateFrom === nextStationDateTo ? new Date(nextStationDateFrom).getFullYear() : new Date(nextStationDateFrom).getFullYear() + '-' + new Date(nextStationDateTo).getFullYear()
    }
    if (prevStation) {
        datePresentPrev = prevStation.dateFrom === prevStation.dateTo ? new Date(prevStation.dateFrom).getFullYear() : new Date(prevStation.dateFrom).getFullYear() + '-' + new Date(prevStation.dateTo).getFullYear()
    }


    let popUpHtml = `<h3>${person.personId} : ${marker.data.stationIdx} (${!datePresent ? 'keine Daten' :  datePresent}) </h3></br>`
                    + `<b>Vorherige (erfasste) Station aus NBG-VZ:</b></br> ${!datePresentPrev ? 'keine Daten' : datePresentPrev + ': ' + prevStation.stationId}</br>`
                    + `<b>Nächste (erfasste) Station aus NBG-VZ:</b></br> ${!datePresentNext ? 'keine Daten' : datePresentNext + ': ' + nextStation.stationId}</br>`


    marker.bindPopup(popUpHtml);
    marker.bindTooltip(`${person.personId}`)

}


const findStationsTillSelectedAggr = function(person) {

    // if (person.personId === 'Teutsch_XX') console.log(`orderedStationsAggr: ${person.orderedStationsAggr}`);
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

        if (person.personId === 'Teutsch_XX') console.log(`stay: ${JSON.stringify(person.orderedStationsAggr[i])}`);
        if (person.personId === 'Teutsch_XX') console.log(`station: ${station.stationId}`);
        if (person.personId === 'Teutsch_XX') console.log(`stay from: ${ts}`);

        // if a stay with dateFrom <= sliderValue is found: add to stationsTillSelected
        if (ts < props.dateSliderValue) {
            if (person.personId === 'Teutsch_XX') console.log(`date ${new Date(ts).toDateString()} < slider ${new Date(props.dateSliderValue).toDateString()}`)    

            stationsTillSelected.push(station);
            stationsIdsTillSelected.push(person.orderedStationsAggr[i]);
            if (person.personId === 'Teutsch_XX') console.log(`added station, moving to next station`);


                // if (person.personId === 'Teutsch_XX') console.log(`index i in ordered stations: ${i}`);
                // if (person.personId === 'Teutsch_XX') console.log(`person.orderedStationsAggr.length - 1: ${person.orderedStationsAggr.length - 1}`);
                if (i === person.orderedStationsAggr.length - 1) {
                    if (person.personId === 'Teutsch_XX') console.log('stay is last stay in persons stations');
                    break;
                }
                
                
            } else if (ts === props.dateSliderValue) {
                if (person.personId === 'Teutsch_XX') console.log(`date ${new Date(ts).toDateString()} === slider ${new Date(props.dateSliderValue).toDateString()}`)

                stationsTillSelected.push(station);
                stationsIdsTillSelected.push(person.orderedStationsAggr[i]);

                if (person.personId === 'Teutsch_XX') console.log(`added station, moving to next station`);
                break;
            } else {
                break; // since stays are ordered, there should be no earlier stay listed after the first one after the selected time
            }
        
       
    }

    return [stationsTillSelected, stationsIdsTillSelected]

}

const createMarkersAndArrowTraces = function(orderedStationsAggr, groupedStationsAggr, person, opacityStep, markers, traces, wrapperStyle, iconCss) {
    let check = ''

    if (person.personId === 'Teutsch_XX') console.log(`${person}`);
    for (let i = 0; i < orderedStationsAggr.length; i += 1) {
        const stay = orderedStationsAggr[i]
        // console.log(`stay: ${JSON.stringify(stay)}`);
        const station = groupedStationsAggr.filter(s => s.stationId === orderedStationsAggr[i].stationId)[0]
        // console.log(`station: ${station}`);
        const opacity = (i+1) * opacityStep;
        const marker = createTraceMarker(person, station, opacity, wrapperStyle, iconCss);
        marker.data = {dateFrom: station.dateFrom, dateTo: station.dateTo, name:person.personId, stationIdx: `${orderedStationsAggr[i].stationId}_${orderedStationsAggr[i].stayIdx}`};

        
        // find previous and next station
        // ! next station is not in filtered values!
        const nextStation = person.orderedStationsAggr[i+1] ? person.groupedStationsAggr[person.orderedStationsAggr[i+1].stationId] : undefined;
        const nextStationStay = person.orderedStationsAggr[i+1];
        const prevStation = person.orderedStationsAggr[i-1] ? person.groupedStationsAggr[person.orderedStationsAggr[i-1].stationId] : undefined;
        const prevStationStay = person.orderedStationsAggr[i-1]

        if (person.personId === 'Teutsch_XX') {
            console.log(`previous station: ${(prevStation) ? prevStation.stationId : undefined}`);
            console.log(`station: ${station.stationId}`);
            console.log(station);
            console.log(`next station id index: ${i+1}; orderedStationsAggr.length: ${orderedStationsAggr.length}`);
            console.log(`next station: ${(nextStation) ? nextStation.stationId : undefined}`);
        }

        createPopUpAndTooltipDate(marker, person, prevStation, prevStationStay, station, stay, nextStation, nextStationStay);
        markers.push(marker);

        if (i < orderedStationsAggr.length - 1) {
            // if (person.personId === 'Teutsch_XX') {
            //     console.log(`line to: ${nextStation.stationId}:`);
            //     check += `${station.stationId}-->`
                
            // }
            const from = [station.lat, station.long]
            const to = [nextStation.lat, nextStation.long]
            const line = L.polyline([from, to], {color: 'black', opacity: opacity+opacityStep})
            const arrowHead = L.polylineDecorator(line, {
                patterns: [
                    {offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 25, polygon: false, pathOptions: {stroke: true, color: 'black', opacity:opacity+opacityStep}})}
                ]
            });
            const arrow = L.layerGroup([line, arrowHead]);
            arrow.data = {name:person.personId, fromStation:station.stationId, toStation:nextStation.stationId}
            traces.push(arrow)
        }
        if (i === orderedStationsAggr.length - 1) check += station.stationId
    }

    // if (person.personId === 'Teutsch_XX') {
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

        // ------ iterate over persons from store

        for (const key of Object.keys(persons)) {
            if (!key) continue

            const person = persons[key];

            // ------ find every station entry the person has up to the currently selected slider value
            // ------ & find dated entry for person that is the next smaller or equal to slider value
            const [stationsTillSelected, stationsIdsTillSelected] = findStationsTillSelectedAggr(person)
            if (person.personId === 'Teutsch_XX') {
                console.log(`stationsTillSelectedX: ${stationsTillSelected}`);
            }

            // ------- filter out person-place entries with dates higher than slider value

            if (props.dateSliderValue >= person.sortedDates[0]) {


                // console.log(`props.dateSliderValue: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                // console.log(`person.sortedDates[0]: ${person.sortedDates[0]} = ${new Date(person.sortedDates[0]).toDateString()}`);
                // console.log(`stationsTillSelected.length = ${stationsTillSelected.length}; opacityStep = ${opacityStep}`)
                // console.log(person.sortedDates)
                // if (person.personId === 'Teutsch_XX') {
                //             console.log(`selected date: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                // }



                // if (person.personId === 'Teutsch_XX') {
                //     console.log(`stations till selected date: ${JSON.stringify(stationsTillSelected)}`);
                // }

                // aggregate stations further
                // const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(stationsTillSelected, person)

                const orderedStationsAggr = stationsIdsTillSelected;
                const groupedStationsAggr = stationsTillSelected;
                if (person.personId === 'Teutsch_XX') {
                    console.log('reduced aggregated stations per person:')
                    console.log(orderedStationsAggr)
                    console.log(groupedStationsAggr)
                }


                // calculate different opacity values for the range of past stations
                const opacityStep = 1 / (orderedStationsAggr.length)

                // if (person.personId === 'Teutsch_XX') {
                //     console.log(`grouped stations ${orderedStationsAggr}:`);
                //     console.log(groupedStationsAggr);
                //     console.log(`length grouped stations: ${orderedStationsAggr.length} opacity step ${opacityStep}`);
                // }

                // create markers and polylines
                const markers = []
                const traces = []
                createMarkersAndArrowTraces(orderedStationsAggr, groupedStationsAggr, person, opacityStep, markers, traces, wrapperStyle, iconCss)


                markers.forEach(m => personMarkers.push(m))
                traces.forEach(t => personTraces.push(t))

                // console.log(`length markers ${person.personId}: ${markers.length}`);
                // console.log(`length traces ${person.personId} : ${traces.length}`);

                // if (person.personId === 'Teutsch_XX') {
                //     console.log(markers);
                // }
            }

        }
   
        console.log(`length markers total: ${personMarkers.length}`);
        console.log(`length traces total: ${personTraces.length}`);
        console.log(personMarkers)
        console.log(personTraces)

        // filter station by selected names
        const [markersFilteredName, tracesFilteredName] = filterByNames(selectedValues.value, personMarkers, personTraces)

        // create layer groups from initial markers
        console.log(markersFilteredName)
        console.log(tracesFilteredName)
        personLayerMarkers = L.layerGroup(markersFilteredName);
        personLayerTraces = L.layerGroup(tracesFilteredName)

        currentPersonMarkers = markersFilteredName;
        currentPersonTraces = tracesFilteredName;

        // console.log('markers added to layergroup')

}


    /**
     * In the persons view, markers represent person. Therefore, if the year changes, a markers
     * position may have to be updated according to the slider value. Since markers cannot be created without lat/long,
     * an actual update is not possible. Instead, the watch function on slider value has to create all markers for 
     * persons which have a location for the respective year, clear the layer and attach the new markers.
     * 
     * This already implies filtering by year, after which only filtering by name has to happen. 
     */
    watch(() => props.dateSliderValue, () => {
        console.log('triggered watch for slider!')
        if (currentPersonMarkers && currentPersonTraces && personLayerMarkers && personLayerTraces) {
            console.log('old layers present')
            // console.log(selectedValues.value)
            personLayerMarkers.clearLayers() // apparently critical for slider performance to do this before creating new markers...?
            personLayerTraces.clearLayers() 

            createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss);
            showPersonsLayer(personLayerMarkers, personLayerTraces, props.map);
  

    }    

})

    const onSelectedNamesUpdate = function (selectedValues, personLayer, personMarkers) {
        if (personMarkers && personLayer) {
            // console.log('On selected names update:')
            // console.log(selectedValues) 
            // console.log(personMarkers)
            if (personLayer) personLayer.clearLayers()
            // console.log('removed markers')
            const filtered = filterByNames(selectedValues, personMarkers) // !!! selectedValues comes from template here, can access directly not via .value
            filtered.forEach(marker => marker.addTo(personLayer))

        }
    }

    const showPersonsLayer = function(markerLayerGroup, traceLayerGroup, map) {
        markerLayerGroup.addTo(map)
        traceLayerGroup.addTo(map)
    }

    const hidePersonsLayer = function(markerLayerGroup, traceLayerGroup, map) {
        markerLayerGroup.removeFrom(map)
        traceLayerGroup.removeFrom(map)
    }

    const filterByNames = function(selectedValues, markers, traces) {

        const markersFilteredName = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.name))
        const tracesFilteredName = selectedValues.length == 0 ? traces : traces.filter(trace => selectedValues.includes(trace.data.name))
        // console.log(filteredByNames)
        // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return [markersFilteredName, tracesFilteredName]
    }

    onMounted(async () => {
        console.log('RENDERED PERSONS LAYER')
        //console.log('Person view map prop: ');
        //console.log(props.map);

        if (!personsStore.loaded) await personsStore.readData(personsStore.pathToDataFile)

        console.log('personsStore.persons:')
        console.log(personsStore.persons)

        if (currentPersonMarkers === undefined) createPersonMarkersDate(personsStore.persons, wrapperStyle, iconCss)
        nameList.value = Array.from(Object.keys(personsStore.persons))
        // console.log('nameList from person store:')
        // console.log(nameList.value)

        showPersonsLayer(personLayerMarkers, personLayerTraces, props.map);


    })

    onUnmounted(() => hidePersonsLayer(personLayerMarkers, personLayerTraces, props.map))


</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate(selectedValues, props.sliderValue, personLayer, currentPersonMarkers)" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>




  