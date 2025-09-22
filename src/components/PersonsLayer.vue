<script setup>
    import Map from './Map.vue'
    import L from "leaflet";
    import { usePersonsPlacesStore } from '../stores/personsPlacesStore'
    import {onMounted, onUnmounted} from 'vue'

    /**
     * @todo use person store as well
     */
     const personsPlacesStore = usePersonsPlacesStore(); 

    const props = defineProps({
        map: Object,
        sliderValue: Number
    })

    let personMarkers = undefined;

    const createPersonMarkers = function(stations) {
        console.log("Attempting to add " + Object.keys(stations).length + " markers")
        const markers = []
        for (const key of Object.keys(stations)) {
            if (!key) continue
            if (stations.hasOwnProperty(key)) {
                //console.log(key)
                
                const station = stations[key]
                //console.log(key, station)
                
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
                    html:html, //`<div style="${markerCss}" class="marker-pin"><i class="mdi mdi-account" style=" transform: rotate(+45deg)"></div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]})
                // var myIcon = L.divIcon({className: 'my-div-icon', html:'<i class="mdi mdi-account"></i>'})
                // var myIcon = L.divIcon({className: 'my-div-icon', html:'<v-icon color="teal-darken-2" icon="mdi-account" size="large"></v-icon>'});
                const marker = L.marker([station.lat, station.long], {icon: myIcon, title: station.stationId})

                markers.push(marker)
            }

        }
        personMarkers = L.layerGroup(markers);

    }

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

        if (personMarkers === undefined) createPersonMarkers(placesStore.entri)

        showPersonsLayer(personMarkers, props.map);

    })

    onUnmounted(() => hidePersonsLayer(personMarkers, props.map))


</script>
<template>
</template>

<!-- <style scoped>
.marker-pin {
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  background: #c30b82;
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
}
.marker-pin::after {
    content: '';
    width: 24px;
    height: 24px;
    margin: 3px 0 0 3px;
    background: #fff;
    position: absolute;
    border-radius: 50%;
 }

.custom-div-icon i {
   position: absolute;
   width: 22px;
   font-size: 22px;
   left: 0;
   right: 0;
   margin: 10px auto;
   text-align: center;
}
</style> -->



  