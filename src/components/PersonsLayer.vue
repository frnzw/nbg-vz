<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePersonsPlacesStore } from '../stores/personsPlacesStore'
    import { usePersonsStore } from '../stores/personsStore'
    import {onMounted, onUnmounted, watch, ref} from 'vue' 
    import SearchField from './SearchField.vue'

    const personsPlacesStore = usePersonsPlacesStore();
    const personsStore = usePersonsStore();

    const props = defineProps({
        map: Object,
        sliderValue: Number,
        dateSliderValue: Number
    })

    let currentPersonMarkers = undefined;
    let personLayer = undefined;


    const facetName = "Personennamen"
    let nameList = ref([])
    const selectedValues = ref([])


    const markerCss = 'background-color:#c30b82; '
                            + 'width: 50px; height: 50px; '
                            + 'transform: rotate(-45deg); '
                            + 'border-radius: 50% 50% 50% 0; '
 
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

    const personIcon = L.divIcon({
            className: 'custom-div-icon', 
            html:html, 
            iconSize: [30, 42],
            iconAnchor: [15, 42]
    });

    const createPopUpAndTooltip = function(marker, person, year) {

        const currentYearPos = person.stations[year] ? person.stations[year].position : undefined
        const currentYear = person.stations[year] ? person.sortedYears[currentYearPos] : undefined

        let prevYear, nextYear;
        
        if (currentYearPos === 0) {
            nextYear = person.stations[year] ? person.sortedYears[currentYearPos + 1] : undefined
        } else if (currentYearPos === person.sortedYears.length - 1) {
            prevYear = person.stations[year] ? person.sortedYears[currentYearPos - 1] : undefined 
        } else {
            nextYear = person.stations[year] ? person.sortedYears[currentYearPos + 1] : undefined
            prevYear = person.stations[year] ? person.sortedYears[currentYearPos - 1] : undefined 
        }
        // console.log(currentYearPos)
        // console.log(prevYear, currentYear, nextYear)
        let popUpHtml = `<h3>${person.personId}</h3></br>`
                        + `<b>Vorherige (erfasste) Station aus NBG-VZ:</b></br> ${!prevYear ? 'keine Daten' : prevYear + ': ' + person.stations[person.sortedYears[currentYearPos - 1 ]].stationId}</br>`
                        + `<b>Nächste (erfasste) Station aus NBG-VZ:</b></br> ${!nextYear ? 'keine Daten' : nextYear + ': ' + person.stations[person.sortedYears[currentYearPos + 1 ]].stationId}</br>`


        marker.bindPopup(popUpHtml);
        marker.bindTooltip(`${person.personId}`)

}

const createPopUpAndTooltipDate = function(marker, person, lastStationPosition, lastRecordedDate) {

    let prevDate, nextDate;

    // find the entries for the station before and after the last known station, if any

    if (lastStationPosition === 0) { // last known station is first station

        prevDate = undefined;
        nextDate = person.sortedDates.length > 1 ? person.sortedDates[1] : undefined

    } else if (lastStationPosition === person.sortedDates.length - 1) { // last known station is last station

        prevDate = person.sortedDates.length > 1 ? person.sortedDates[lastStationPosition - 1] : undefined
        nextDate = undefined;

    } else { // last known station is intermediate station
        nextDate = person.sortedDates[lastStationPosition + 1]
        prevDate = person.sortedDates[lastStationPosition - 1] 
    }

    if (person.personId === 'Luttringshauser_XY') {
        console.log(person);
        console.log(prevDate, lastRecordedDate, nextDate)
        
    }    
    
    let popUpHtml = `<h3>${person.personId}</h3></br>`
                    + `<b>Letzte (erfasste) Station aus NBG-VZ:</b></br> ${!lastRecordedDate ? 'keine Daten' :  new Date(lastRecordedDate).getFullYear() + ': ' + person.stationsDate[lastRecordedDate].stationId}</br>`
                    + `<b>Vorherige (erfasste) Station aus NBG-VZ:</b></br> ${!prevDate ? 'keine Daten' : new Date(prevDate).getFullYear() + ': ' + person.stationsDate[prevDate].stationId}</br>`
                    + `<b>Nächste (erfasste) Station aus NBG-VZ:</b></br> ${!nextDate ? 'keine Daten' : new Date(nextDate).getFullYear() + ': ' + person.stationsDate[nextDate].stationId}</br>`


    marker.bindPopup(popUpHtml);
    marker.bindTooltip(`${person.personId}`)

}

    const createPersonMarkersX = function(persons) {
        // console.log("Attempting to add " + Object.keys(persons).length + " per son markers")
        const personMarkers = []
        for (const key of Object.keys(persons)) {
            if (!key) continue

            const person = persons[key];

            // already have to filter by year here, cannot create marker without assigning lat/long
            const latYear = person.stations[props.sliderValue] ? person.stations[props.sliderValue].lat : undefined
            const longYear = person.stations[props.sliderValue] ? person.stations[props.sliderValue].long : undefined
            if (latYear && longYear) {
                const marker = L.marker([latYear, longYear], {icon: personIcon, title: person.stations[props.sliderValue].stationId+person.personId})
                marker.data = {year: props.sliderValue, name:person.personId}
                createPopUpAndTooltip(marker, person, props.sliderValue)
                personMarkers.push(marker)
            }

        }
   
        // console.log(`Found ${personMarkers.length} person markers for year ${props.sliderValue}`)
        

        const filtered = filterByNames(selectedValues.value, personMarkers)
        personLayer = L.layerGroup(filtered);
        currentPersonMarkers = personMarkers;
        personLayer.addTo(props.map)
        // console.log('markers added to layergroup')

}

const  createPersonMarkersDate = function(persons) {
        // console.log("Attempting to add " + Object.keys(persons).length + " per son markers")
        const personMarkers = []
        for (const key of Object.keys(persons)) {
            if (!key) continue

            const person = persons[key];

            // filter out person-place entries with dates higher than slider value
            if (props.dateSliderValue >= person.sortedDates[0]) {
                // console.log(`props.dateSliderValue: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                // console.log(`person.sortedDates[0]: ${person.sortedDates[0]} = ${new Date(person.sortedDates[0]).toDateString()}`);
                
                // find dated entry for person that is the next smaller or equal to slider value
                let lastStationPosition;
                let lastRecordedDate;
                let lastStationBeforeSelectedTime;

                // console.log(person.sortedDates)
                if (person.personId === 'Luttringshauser_XY') {
                            console.log(`selected date: ${props.dateSliderValue} = ${new Date(props.dateSliderValue).toDateString()}`);
                }
                for (const ts of person.sortedDates) {
                    if (person.personId === 'Luttringshauser_XY') {
                            console.log(`date: ${ts} = ${new Date(ts).toDateString()}`);
                    }
                    if (ts < props.dateSliderValue) {
                        continue;
                    } else if (ts === props.dateSliderValue) {
                        lastStationPosition = person.sortedDates.indexOf(ts);
                        lastRecordedDate = person.sortedDates[lastStationPosition];
                        lastStationBeforeSelectedTime = person.stationsDate[person.sortedDates[lastStationPosition]];
                        break; 
                    } else {
                        lastStationPosition = person.sortedDates.indexOf(ts) - 1;
                        lastRecordedDate = person.sortedDates[lastStationPosition];
                        lastStationBeforeSelectedTime = person.stationsDate[person.sortedDates[lastStationPosition]];
                        break;
                    }
                }
                if (person.personId === 'Luttringshauser_XY') {
                            console.log(`last recorded date: ${lastRecordedDate} = ${new Date(lastRecordedDate).toDateString()}`);
                }

                if (lastStationBeforeSelectedTime) {
                    const marker = L.marker([lastStationBeforeSelectedTime.lat, lastStationBeforeSelectedTime.long], {icon: personIcon, title: lastStationBeforeSelectedTime.stationId+person.personId})
                    marker.data = {date: lastStationBeforeSelectedTime.date, name:person.personId}
                    createPopUpAndTooltipDate(marker, person, lastStationPosition, lastRecordedDate)
                    personMarkers.push(marker)
                }
            }

        }
   
        // console.log(`Found ${personMarkers.length} person markers for year ${props.sliderValue}`)
        

        const filtered = filterByNames(selectedValues.value, personMarkers)
        personLayer = L.layerGroup(filtered);
        currentPersonMarkers = personMarkers;
        personLayer.addTo(props.map)
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
    watch(() => props.dateSliderValue, (date) => {
        console.log('triggered watch for slider!')
        if (currentPersonMarkers && personLayer) {
            // console.log(selectedValues.value)
            if (personLayer) personLayer.clearLayers() // apparently critical for slider performance to do this before creating new markers...?
            const personMarkers = []
            for (const key of Object.keys(personsStore.persons)) {
                const person = personsStore.persons[key];
                // already have to filter by year here, cannot create marker without assigning lat/long
                
            // filter out person-place entries with dates higher than slider value
            if (date >= person.sortedDates[0]) {
                // console.log(`date: ${date} = ${new Date(date).toDateString()}`);
                // console.log(`person.sortedDates[0]: ${person.sortedDates[0]} = ${new Date(person.sortedDates[0]).toDateString()}`);
                // find dated entry for person that is the next smaller or equal to slider value
                let lastStationPosition;
                let lastRecordedDate;
                let lastStationBeforeSelectedTime;

                // console.log(person.sortedDates)
                if (person.personId === 'Luttringshauser_XY') {
                            console.log(`selected date: ${date} = ${new Date(date).toDateString()}`);
                }
                for (const ts of person.sortedDates) {
                    if (person.personId === 'Luttringshauser_XY') {
                            console.log(`date: ${ts} = ${new Date(ts).toDateString()}`);
                    }
                    if (ts < date) {
                        continue;
                    } else if (ts === date) {
                        lastStationPosition = person.sortedDates.indexOf(ts);
                        lastRecordedDate = person.sortedDates[lastStationPosition];
                        lastStationBeforeSelectedTime = person.stationsDate[person.sortedDates[lastStationPosition]];
                        break; 
                    } else {
                        lastStationPosition = person.sortedDates.indexOf(ts) - 1;
                        lastRecordedDate = person.sortedDates[lastStationPosition];
                        lastStationBeforeSelectedTime = person.stationsDate[person.sortedDates[lastStationPosition]];
                        break;
                    }
                }
                if (person.personId === 'Luttringshauser_XY') {
                            console.log(`last recorded date: ${lastRecordedDate} = ${new Date(lastRecordedDate).toDateString()}`);
                }

                if (lastStationBeforeSelectedTime) {
                    const marker = L.marker([lastStationBeforeSelectedTime.lat, lastStationBeforeSelectedTime.long], {icon: personIcon, title: lastStationBeforeSelectedTime.stationId+person.personId})
                    marker.data = {date: lastStationBeforeSelectedTime.date, name:person.personId}
                    createPopUpAndTooltipDate(marker, person, lastStationPosition, lastRecordedDate)
                    personMarkers.push(marker)
                }
            }

            
            // console.log('removed markers')
            const filtered = filterByNames(selectedValues.value, personMarkers)
            filtered.forEach(marker => marker.addTo(personLayer))
            currentPersonMarkers = personMarkers;
        }

    }    

    })

    const onSelectedNamesUpdate = function (selectedValues, sliderValue, personLayer, personMarkers) {
        if (personMarkers && personLayer) {
            // console.log('On selected names update:')
            // console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
            // console.log(personMarkers)
            if (personLayer) personLayer.clearLayers()
            // console.log('removed markers')
            const filtered = filterByNames(selectedValues, personMarkers)
            filtered.forEach(marker => marker.addTo(personLayer))

        }
    }

    const showPersonsLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePersonsLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    const filterByNames = function(selectedValues, markers) {

        const filteredByNames = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.name))
        // console.log(filteredByNames)
        // console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

        return filteredByNames
    }

    onMounted(async () => {
        console.log('RENDERED PERSONS LAYER')
        //console.log('Person view map prop: ');
        //console.log(props.map);
        //console.log('pathToDataFile: ' + personsPlacesStore.pathToDataFile)
        if (!personsPlacesStore.loaded) await personsPlacesStore.readData(personsPlacesStore.pathToDataFile)
        if (!personsStore.loaded) await personsStore.readData(personsStore.pathToDataFile)
        //console.log(personsPlacesStore.entries)
        console.log('personsStore.persons:')
        console.log(personsStore.persons)

        // if (personMarkers === undefined) createPersonMarkers(personsPlacesStore.entries)
        // if (currentPersonMarkers === undefined) createPersonMarkersX(personsStore.persons)
        if (currentPersonMarkers === undefined) createPersonMarkersDate(personsStore.persons)
        nameList.value = Array.from(Object.keys(personsStore.persons))
        // console.log('nameList from person store:')
        // console.log(nameList.value)

        showPersonsLayer(personLayer, props.map);


    })

    onUnmounted(() => hidePersonsLayer(personLayer, props.map))


</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate(selectedValues, props.sliderValue, personLayer, currentPersonMarkers)" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>




  