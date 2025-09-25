import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePersonsStore = defineStore('persons', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const entries = ref({});
    const persons = ref({});
    let nameList = ref([])

    function extractStationsPerPerson(data, personId) {
        const filteredByPerson = data.filter((entry) => entry.person === personId);
        // console.log(filteredByPerson)
        // list stations a person was present at per year
        // group by year using reduce

        // in the future, when using fine grained timestamps: make this sparse, recording not fixed
        // intervalls but t0, ..., tn where person has changed place
        const grouped = filteredByPerson.reduce((acc, entry) => {
            acc[entry.year] = acc[entry.year] || {stationId: entry.stationId, lat:entry.lat, long:entry.long};
            return acc;
        }, {});
        // console.log(grouped)
        return grouped
    }
    
    async function readData(pathToDataFile) {
        try {
            const res = await fetch(pathToDataFile, {
                method: 'get',
                });
            if (!res.ok) {
                throw Error(`Failed to read data from local file ${pathToDataFile}`);
            }
            const csvString = await res.text()
            const data = Papa.parse(csvString, {header:true, dynamicTyping: true}).data;

            // reduce to hash map of unique personIds
            const personIds = Array.from(new Set(data.map((entry) => {
                return entry.person;
            })))

            console.log('personIds in person store:')
            console.log(personIds)
 
            for (const personId of personIds) {
                // console.log(personId)
                if (!personId) continue;
                const stationsExtracted = extractStationsPerPerson(data, personId)
                persons.value[personId] = {
                    personId: personId,
                    stations: stationsExtracted,
                    nofStationsTotal: Object.keys(stationsExtracted).length
                }
            }
            console.log(persons.value)


            console.log('Loaded personsStore')
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, loaded, persons }
  })