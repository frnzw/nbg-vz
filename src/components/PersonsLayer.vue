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

    let personMarkers = undefined;
    let personLayer = undefined;


    const facetName = "Personennamen"
    let nameList = ref([])
    const selectedValues = ref([])
    

    const createPersonMarkers = function(entries) {
        console.log("Attempting to add " + entries.length + " per son markers")
        personMarkers = []
        for (const entry of entries) {
            if (!entry.stationId) continue

                // console.log(entry)
                
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



                var myIcon = L.divIcon({
                    className: 'custom-div-icon', 
                    html:html, 
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]})

                const marker = L.marker([entry.lat, entry.long], {icon: myIcon, title: entry.stationId+entry.person})
                marker.data = {year: entry.year, name:entry.person}
                personMarkers.push(marker)
            }

            const filtered = applyFilters(props.sliderValue, selectedValues.value, personLayer, personMarkers)
            personLayer = L.layerGroup(filtered);
            personLayer.addTo(props.map)
            console.log('markers added to layergroup')

    }

    watch(() => props.sliderValue, (sliderValue) => {
        console.log('triggered watch for slider!')
        if (personMarkers && personLayer) {
            console.log(selectedValues.value)
            const filtered = applyFilters(sliderValue, selectedValues.value, personLayer, personMarkers)
            filtered.forEach(marker => marker.addTo(personLayer))

        }

    })

    const onSelectedNamesUpdate = function (selectedValues, sliderValue, personLayer, personMarkers) {
        if (personMarkers && personLayer) {
            console.log('On selected names update:')
            console.log(selectedValues) // !!! selectedValues comes from template here, can access directly not via .value
            const filtered = applyFilters(sliderValue, selectedValues, personLayer, personMarkers)
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

    onMounted(async () => {
        console.log('RENDERED PERSONS LAYER')
        console.log('Person view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + personsPlacesStore.pathToDataFile)
        if (!personsPlacesStore.loaded) await personsPlacesStore.readData(personsPlacesStore.pathToDataFile)
        if (!personsStore.loaded) await personsStore.readData(personsStore.pathToDataFile)
        console.log(personsPlacesStore.entries)


        if (personMarkers === undefined) createPersonMarkers(personsPlacesStore.entries)
        nameList.value = Array.from(personsStore.nameIDs)
        console.log(nameList)

        showPersonsLayer(personLayer, props.map);
        console.log(personMarkers[0])

    })

    onUnmounted(() => hidePersonsLayer(personLayer, props.map))


</script>
<template>
    <v-container>
        <SearchField v-model="selectedValues" @update:modelValue="onSelectedNamesUpdate(selectedValues, props.sliderValue, personLayer, personMarkers)" :v-if="nameList.length > 0" :facet="facetName" :facetData="nameList"/>
        <p>{{ selectedValues }}</p>
    </v-container>
</template>




  