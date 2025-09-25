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
        sliderValue: Number
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

    const createPersonMarkersX = function(persons) {
        console.log("Attempting to add " + Object.keys(persons).length + " per son markers")
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

                const sortedYears = Object.keys(person.stations).sort((a, b) => a - b)
                console.log(sortedYears)
                
                const currentYearPos = sortedYears.indexOf(String(props.sliderValue))
                console.log(currentYearPos)
                const prevYear = sortedYears[currentYearPos - 1 ]
                const currentYear = sortedYears[currentYearPos]
                const nextYear = sortedYears[currentYearPos + 1 ]
                console.log(prevYear, currentYear, nextYear)
                let popUpHtml = `<h3>${person.personId}</h3></br>`
                              + `<b>Vorherige (erfasste) Station aus NBG-VZ:</b></br> ${currentYearPos === 0 ? 'keine Daten' : prevYear + ': ' + person.stations[sortedYears[currentYearPos - 1 ]].stationId}</br>`
                              + `<b>Nächste (erfasste) Station aus NBG-VZ:</b></br> ${currentYearPos === sortedYears.length - 1 ? 'keine Daten' : nextYear + ': ' + person.stations[sortedYears[currentYearPos + 1 ]].stationId}</br>`

            
                marker.bindPopup(popUpHtml);


                personMarkers.push(marker)
            }
        }
        console.log(`Found ${personMarkers.length} person markers for year ${props.sliderValue}`)
        

        const filtered = applyFiltersX(selectedValues.value, personMarkers)
        personLayer = L.layerGroup(filtered);
        currentPersonMarkers = personMarkers;
        personLayer.addTo(props.map)
        console.log('markers added to layergroup')

}



    watch(() => props.sliderValue, (sliderValue) => {
        console.log('triggered watch for slider!')
        if (currentPersonMarkers && personLayer) {
            console.log(selectedValues.value)
            const personMarkers = []
            for (const key of Object.keys(personsStore.persons)) {
                const person = personsStore.persons[key];
                // already have to filter by year here, cannot create marker without assigning lat/long
                const latYear = person.stations[props.sliderValue] ? person.stations[props.sliderValue].lat : undefined
                const longYear = person.stations[props.sliderValue] ? person.stations[props.sliderValue].long : undefined

                if (latYear && longYear) {
                    const marker = L.marker([latYear, longYear], {icon: personIcon, title: person.stations[props.sliderValue].stationId+person.personId})
                    marker.data = {year: props.sliderValue, name:person.personId}
                    personMarkers.push(marker)
                }
            }

            if (personLayer) personLayer.clearLayers()
            console.log('removed markers')
            const filtered = applyFiltersX(selectedValues.value, personMarkers)
            filtered.forEach(marker => marker.addTo(personLayer))
            currentPersonMarkers = personMarkers;
        }

            

    })

    const onSelectedNamesUpdate = function (selectedValues, sliderValue, personLayer, personMarkers) {
        if (personMarkers && personLayer) {
            console.log('On selected names update:')
            console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
            console.log(personMarkers)
            if (personLayer) personLayer.clearLayers()
            console.log('removed markers')
            const filtered = applyFiltersX(selectedValues, personMarkers)
            filtered.forEach(marker => marker.addTo(personLayer))

        }
    }

    const showPersonsLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePersonsLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    const applyFilters = function(sliderValue, selectedValues, layer, markers) {
            if (layer) layer.clearLayers()
            console.log('removed markers')

            const filteredByYear = personMarkers.filter(marker => marker.data.year === sliderValue)
            console.log(`Filtered markers for year ${sliderValue}: ${filteredByYear.length}`)
            console.log(typeof(selectedValues))
            console.log(selectedValues)
            const filteredByNames = selectedValues.length == 0 ? filteredByYear : filteredByYear.filter(marker => selectedValues.includes(marker.data.name))
            console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

            return filteredByNames
    }

    const applyFiltersX = function(selectedValues, markers) {


        const filteredByNames = selectedValues.length == 0 ? markers : markers.filter(marker => selectedValues.includes(marker.data.name))
        console.log(filteredByNames)
        console.log(`Filtered markers by names ${selectedValues}: ${filteredByNames.length}`)

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
        if (currentPersonMarkers === undefined) createPersonMarkersX(personsStore.persons)
        nameList.value = Array.from(Object.keys(personsStore.persons))
        console.log('nameList from person store:')
        console.log(nameList.value)

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




  