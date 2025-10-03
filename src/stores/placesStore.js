import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePlacesStore = defineStore('places', () => {

    let loaded = ref(false);
    const pathToDataFile = '/person_place_geoc.csv'
    const stations = ref({});
    
    function aggregatePersonsPerStation(data, stationId) {
        const filteredByStation = data.filter((entry) => entry.stationId === stationId);
        // list / count persons present per year
        // group by year using reduce
        const grouped = filteredByStation.reduce((acc, entry) => {
                if (!acc[entry.year]) acc[entry.year] = {count:0, persons:[]};
                acc[entry.year].count = acc[entry.year].count + 1

                acc[entry.year].persons.push({persId: entry.person, choir:entry.choir})
                return acc;
        }, {});

        return grouped
    }


    function aggregatePersonsPerStationDate(data, stationId) {
        const filteredByStation = data.filter((entry) => entry.stationId === stationId);
        // list / count persons present per year
        // group by year using reduce
        const grouped = filteredByStation.reduce((acc, entry) => {
                
            // build date from year, assuming year-11-01 for NBG-VZ data (source specifies only as "end of year")
            const d = new Date(`${entry.year}-12-31`)

            if (!acc[d.getTime()]) acc[d.getTime()] = {count:0, persons:[]};
            acc[d.getTime()].count = acc[d.getTime()].count + 1
            acc[d.getTime()].persons.push({persId: entry.person, choir:entry.choir})
            
            return acc;
        }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => a - b).map(d => parseInt(d))
        for (const date of sortedDates) {
            grouped[date].position = sortedDates.indexOf(date)
        }
        // console.log(grouped)
        // console.log(sortedDates)
        return [grouped, sortedDates]
    }

    async function readData(pathToDataFile) {
        try {
            const res = await fetch(pathToDataFile, {
                method: 'get',
            });

            if (!res.ok) {
                throw Error(`Failed to read data from local file ${pathToDataFile}`);
            }

            const csvString = await res.text();
            const data = Papa.parse(csvString, {header:true, dynamicTyping: true}).data;
            // console.log(data);
            
            // reduce to hash map of unique stations
            const stationsNames = Array.from(new Set(data.map((entry) => {
                entry.stationId;
            })));
            for (const stationName of stationsNames) {
                if (!stationName) continue;
                stations.value[stationName] = {}
            }


            for (const entry of data) {
                if (entry.stationId === null) continue;
                const [personsAggregatedDate, sortedDates] = aggregatePersonsPerStationDate(data, entry.stationId)
                if (!stations.value[entry.stationId]) {
                    stations.value[entry.stationId] = {
                        stationId: entry.stationId,
                        lat: entry.lat,
                        long: entry.long,
                        persons: aggregatePersonsPerStation(data, entry.stationId),
                        personsAggregatedDate: personsAggregatedDate,
                        sortedDates: sortedDates
                    }
                }
            
            }
            // console.log(stations)
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, stations }
  })