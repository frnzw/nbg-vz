import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePersonsStore = defineStore('persons', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const entries = ref({});
    const nameIDs = ref(new Set())
    
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
            
            // console.log(data)
            for (const entry of data) {
                // console.log(entry)
                nameIDs.value.add(entry.person)
            }

            // console.log(nameIDs.value)
            console.log('Loaded personsStore')
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, loaded, nameIDs }
  })