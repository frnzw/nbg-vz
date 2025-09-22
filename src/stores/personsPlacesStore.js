import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePersonsPlacesStore = defineStore('personsPlaces', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const entries = ref({});
    
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
            console.log('Loaded personsPlacesStore')
            // console.log(data)
        
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, loaded, entries }
  })