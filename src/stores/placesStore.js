import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePlacesStore = defineStore('places', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const stations = ref({});
    
    function aggregateStationSize(data, stationId) {
        const filteredByStation = data.filter((entry) => entry.stationId === stationId);
        // count persons present per year
        // first group by year using reduce
        const grouped = filteredByStation.reduce((acc, entry) => {
                acc[entry.year] = acc[entry.year] || 0;
                acc[entry.year] = acc[entry.year] + 1
                return acc;
        }, {});

        return grouped
    }


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
                        long: entry.long,
                        nofPersons: aggregateStationSize(data, entry.stationId)
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