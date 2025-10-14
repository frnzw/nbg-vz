import { defineStore } from 'pinia'
import {ref} from 'vue'
import Papa from 'papaparse';

export const usePersonsStore = defineStore('persons', () => {

    let loaded = ref(false);
    const pathToDataFile = `${import.meta.env.BASE_URL}person_place_geoc.csv`
    const persons = ref({});


    /**
     * 
     * Import, parsing, extraction functions are specific to different datasets.
     */

    /**
     * Extract a persons recorded stations by date, dictionary style.
     * @param {*} data 
     * @param {*} personId 
     * @returns 
     */
    function extractStationsPerPersonDate(data, personId) {
        const filteredByPerson = data.filter((entry) => entry.person === personId);

        const grouped = filteredByPerson.reduce((acc, entry) => {
            // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
            const d = new Date(`${entry.year}-12-31`)

            acc[d.getTime()] = acc[d.getTime()] || {date: d, stationId: entry.stationId, lat:entry.lat, long:entry.long};
            return acc;
        }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => a - b).map(d => parseInt(d))

        for (const date of sortedDates) {
            grouped[date].position = sortedDates.indexOf(date)
        }
        return [grouped, sortedDates]
    }

    /**
     * Aggregate a persons recorded stations, summing up multiple records for the same station in
     * a row resulting in a stay from...to... , listing separate stays of a person in an ordered 
     * subattribute (person.groupedStationsAggr[stationId].stays).
     * 
     * @param {*} data 
     * @param {*} personId 
     * @returns 
     */
    const aggregateStations = function(data, personId) {

        
        // first: stations per person, ordered by date
        const filteredByPerson = data.filter((entry) => entry.person === personId).sort((a,b) => a.year - b.year);
        // aggregate further:
        const orderedStationsAggr = []
        const groupedStationsAggr = filteredByPerson.reduce((acc, entry) => {
    
            // build date from year, assuming year-11-01 for NBG-VZ data (source specifies only as "end of year")
            const d = new Date(`${entry.year}-12-31`)

            // station was visited before
            if (acc[entry.stationId]) {
    
                const idx = Object.keys(acc[entry.stationId].stays).map((k) => {return parseInt(k)});
                const idxMax = Math.max(...idx)
                // check if person stays in same place 
                if (acc[entry.stationId].stationId === orderedStationsAggr[orderedStationsAggr.length - 1].stationId) {
                    // -> update .dateTo of most recent stay
                    acc[entry.stationId].stays[idxMax].dateTo = d.getTime();

                } else {
                    // -> add new subentry to acc with stationId+_count
                    acc[entry.stationId].stays[idxMax+1] = {
                        dateFrom: d.getTime(), dateTo: d.getTime(),
                    }
                    orderedStationsAggr.push({stationId: entry.stationId, stayIdx:idxMax+1});
                }
                
            } else {
                // create inital acc entry
                acc[entry.stationId] = {
                    stationId: entry.stationId, 
                    lat:entry.lat, long:entry.long,
                };
    
                acc[entry.stationId].stays = {0: { 
                    dateFrom: d.getTime(), dateTo: d.getTime(),
                }};
    
                orderedStationsAggr.push({stationId: entry.stationId, stayIdx:0});
                
            }
            return acc;
        }, {});
    
        return [orderedStationsAggr, groupedStationsAggr]
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

            // console.log('personIds in person store:')
            // console.log(personIds)
 
            for (const personId of personIds) {
                // console.log(personId)
                if (!personId) continue;

                // different structures for same data – redundant, but saves time filtering / aggregation
                // for interaction / animations
                // these redundant structures should come from a backend in the future, only being loaded here
                const [stationsExtractedDate, sortedDates] = extractStationsPerPersonDate(data, personId)
                const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(data, personId)
                persons.value[personId] = {
                    personId: personId,
                    stationsDate: stationsExtractedDate,
                    sortedDates: sortedDates,
                    groupedStationsAggr: groupedStationsAggr,
                    orderedStationsAggr: orderedStationsAggr                   
                }
            }


            console.log('Loaded personsStore')
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, loaded, persons }
  })