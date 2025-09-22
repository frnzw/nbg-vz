<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePersonsPlacesStore } from '../stores/personsPlacesStore'
    import {onMounted, onUnmounted, watch} from 'vue'

     const personsPlacesStore = usePersonsPlacesStore(); 

    const props = defineProps({
        map: Object,
        sliderValue: Number
    })

    let personMarkers = undefined;
    let personLayer = undefined;

    const createPersonMarkers = function(entries) {
        console.log("Attempting to add " + entries.length + " person markers")
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
                marker.data = {year: entry.year}
                personMarkers.push(marker)
            }

            const filteredByYear = personMarkers.filter(marker => marker.data.year === props.sliderValue)
            filteredByYear.forEach(marker => marker.addTo(personLayer))

            personLayer = L.layerGroup(filteredByYear);
            console.log('markers added to layergroup')

    }

    watch(() => props.sliderValue, (sliderValue) => {
        console.log('triggered watch for slider!')
        if (personMarkers && personLayer) {
            personLayer.clearLayers()
            console.log('removed markers')

            const filteredByYear = personMarkers.filter(marker => marker.data.year === sliderValue)
            filteredByYear.forEach(marker => marker.addTo(personLayer))
            console.log(`Filtered markers for year ${sliderValue}: ${filteredByYear.length}`)

        }

    })

    const showPersonsLayer = function(layergroup, map) {
        layergroup.addTo(map)
    }

    const hidePersonsLayer = function(layergroup, map) {
        layergroup.removeFrom(map)
    }

    onMounted(async () => {
        console.log('RENDERED PERSONS LAYER')
        console.log('Person view map prop: ');
        console.log(props.map);
        console.log('pathToDataFile: ' + personsPlacesStore.pathToDataFile)
        if (!personsPlacesStore.loaded) await personsPlacesStore.readData(personsPlacesStore.pathToDataFile)
        console.log(personsPlacesStore.entries)

        if (personMarkers === undefined) createPersonMarkers(personsPlacesStore.entries)

        showPersonsLayer(personLayer, props.map);
        console.log(personMarkers[0])

    })

    onUnmounted(() => hidePersonsLayer(personLayer, props.map))


</script>
<template>
</template>




  