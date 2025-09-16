<script setup>
  import { onMounted, ref } from 'vue'
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import Papa from 'papaparse';

  const center = [37.7749, -122.4194];
  const initMap = function() {
    const map = L.map("mapContainer").setView(center, 2);
    const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'), 
        {
          attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
          minZoom: 0
    });

    tileLayer.addTo(map)

    return map
  }

  const data = ref('')
  const stations = ref({})
  const pathToDataFile = '/person_place_geoc.csv'
  const readData = async function(pathToDataFile) {
    const res = await fetch(pathToDataFile, {
            method: 'get',
            headers: {
                'content-type': 'text/csv;charset=UTF-8'
            }});
    if (!res.ok) {
      console.warn(`Failed to read data from local file ${pathToDataFile}`);
      return
    }
    const csvString = await res.text()
    return Papa.parse(csvString, {header:true, dynamicTyping: true}).data;

  }

  const addStationMarkers = function(stations, map) {

    for (const key of Object.keys(stations)) {
      if (!key) continue
      if (stations.hasOwnProperty(key)) {
        console.log(key)
        
        const station = stations[key]
        console.log(key, station)
  
        const marker = L.marker([station.lat, station.long], {
          title: station.stationId
        })

        marker.addTo(map)
      }

    }
    
  }
  
  onMounted(async () => {

    const map = initMap();

    data.value = await readData(pathToDataFile);

    
    for (const entry of data.value) {
      // console.log(entry)
      if (entry.stationId === null) continue;

      if (!stations.value[entry.stationId]) {
          stations.value[entry.stationId] = {
              stationId: entry.stationId,
              lat: entry.lat,
              long: entry.long
          }
      }
    
    }
    console.log(stations.value)

    addStationMarkers(stations.value, map)

  });





  
  


</script>

<template>
  <div id="container">
    <h1>Vue + leaflet starter</h1>
    <div id="mapContainer"></div>
    <p>{{ stations }}</p>
  </div>
</template>


<style scoped>
#mapContainer {
 width: 90vw;
 height: 80vh;
}
</style>
