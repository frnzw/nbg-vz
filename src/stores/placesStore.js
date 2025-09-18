import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePlacesStore = defineStore('places', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const stations = ref({});
    
    async function readData(pathToDataFile) {
        try {
            const res = await fetch(pathToDataFile, {
                method: 'get',
                });
            if (!res.ok) {
                throw Error(`Failed to read data from local file ${pathToDataFile}`);
            return
            }
            const csvString = await res.text()
            const data = Papa.parse(csvString, {header:true, dynamicTyping: true}).data;
            console.log(data)
            
            for (const entry of data) {
                if (entry.stationId === null) continue;
        
                if (!stations.value[entry.stationId]) {
                    stations.value[entry.stationId] = {
                        stationId: entry.stationId,
                        lat: entry.lat,
                        long: entry.long
                    }
                }
            
            }
            console.log(stations)
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, stations }
  })