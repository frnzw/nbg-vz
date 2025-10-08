import { defineStore } from 'pinia'
import {computed, ref} from 'vue'
import Papa from 'papaparse';

export const usePersonsStore = defineStore('persons', () => {

    let loaded = ref(false);
    const pathToDataFile = `${import.meta.env.BASE_URL}person_place_geoc.csv`
    const persons = ref({});


    /**
     * 
     * Import, parsing, extraction functions are specific to different datasets.
     */



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

        const sortedYears = Object.keys(grouped).sort((a, b) => a - b)

        for (const year of sortedYears) {
            grouped[year].position = sortedYears.indexOf(String(year))
        }
        // console.log(grouped)
        return [grouped, sortedYears]
    }

    function extractStationsPerPersonDate(data, personId) {
        const filteredByPerson = data.filter((entry) => entry.person === personId);

        // in the future, when using fine grained timestamps: make this sparse, recording not fixed
        // intervalls but t0, ..., tn where person has changed place
        const grouped = filteredByPerson.reduce((acc, entry) => {
            // build date from year, assuming year-11-01 for NBG-VZ data (source specifies only as "end of year")
            const d = new Date(`${entry.year}-12-31`)

            acc[d.getTime()] = acc[d.getTime()] || {date: d, stationId: entry.stationId, lat:entry.lat, long:entry.long};
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

    const aggregateStations = function(data, personId) {

        
        // first: stations per person, ordered by date
        const filteredByPerson = data.filter((entry) => entry.person === personId).sort((a,b) => a.year - b.year);
        if (personId === 'Teutsch_XX') {
            console.log('---------- Aggregate stations in personsStore --------------')
            console.log('filteredByPerson:')
            console.log(filteredByPerson)
        }
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
                    if (personId === 'Teutsch_XX') {
                        console.log('updating station dateTo')
                        console.log(idx)
                        console.log(idxMax);
                    }
                    // -> update .dateTo of most recent stay
                    acc[entry.stationId].stays[idxMax].dateTo = d.getTime();

                } else {
                    if (personId === 'Teutsch_XX') {
                        console.log('updating station stays:');
                        console.log(acc[entry.stationId]);
                        console.log(orderedStationsAggr);
                        
                    }
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
    
                if (personId === 'Teutsch_XX') {
                    console.log('adding station:')
                    console.log(acc[entry.stationId])
                    console.log(orderedStationsAggr)
                }
                
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
                const [stationsExtracted, sortedYears] = extractStationsPerPerson(data, personId)
                const [stationsExtractedDate, sortedDates] = extractStationsPerPersonDate(data, personId)

                const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(data, personId)
                persons.value[personId] = {
                    personId: personId,
                    stations: stationsExtracted,
                    nofStationsTotal: Object.keys(stationsExtracted).length,
                    sortedYears: sortedYears,
                    stationsDate: stationsExtractedDate,
                    sortedDates: sortedDates,
                    groupedStationsAggr: groupedStationsAggr,
                    orderedStationsAggr: orderedStationsAggr                   
                }
            }
            // console.log(persons.value)


            console.log('Loaded personsStore')
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFile, readData, loaded, persons }
  })