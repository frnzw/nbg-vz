<script setup>
    import Map from './Map.vue'
    // import L from "leaflet";
    // import personStore
    import {onMounted, reactive} from 'vue'

    // const placesStore = usePlacesStore(); <--- use PersonStore

    // will be set async by event of child component, make reactive to pick that change up in
    // lifecycle methods of vue (e.g. onMount)
    let state = reactive({
        map: undefined
    })

    function onMapIsReady(map) {
        // console.log('Map instance:', map)
        state.map = map;
    }

    // function for adding person markers etc

    onMounted(async () => {
        // init loading of data into store
        // apply further logic when map is ready
    })

</script>
<template>
    <div>
        <Map @mapIsReady="onMapIsReady" />
    </div>

</template>