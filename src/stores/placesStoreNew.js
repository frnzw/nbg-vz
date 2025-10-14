import { defineStore } from 'pinia'
import {ref} from 'vue'
import Papa from 'papaparse';

export const usePlacesStore = defineStore('places', () => {

    let loaded = ref(false);
    const pathToDataFilePlaces = `${import.meta.env.BASE_URL}places_vis.csv`;
    const pathToDataFilePersonsPlaces = `${import.meta.env.BASE_URL}persons_places_vis.csv`;
    const stations = ref({});

    function aggregatePersonsPerStationDate(data, stationId) {
        const filteredByStation = data.filter((entry) => entry.stationId === stationId);
        // list / count persons present per year
        // group by year using reduce
        const grouped = filteredByStation.reduce((acc, entry) => {
                
            // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
            const d = new Date(`${entry.year}-12-31`)

            if (!acc[d.getTime()]) acc[d.getTime()] = {count:0, persons:[]};
            acc[d.getTime()].count = acc[d.getTime()].count + 1 // @todo: check if this is used at all
            acc[d.getTime()].persons.push({persId: entry.persId, choir:entry.choir})
            
            return acc;
        }, {});

        const sortedDates = Object.keys(grouped).sort((a, b) => a - b).map(d => parseInt(d))
        for (const date of sortedDates) {
            grouped[date].position = sortedDates.indexOf(date) // @todo: check if this is used at all
        }
        // console.log(grouped)
        // console.log(sortedDates)
        return [grouped, sortedDates]
    }

    async function readData(pathToDataFilePlaces, pathToDataFilePersonsPlaces) {
        try {
            // kick off async data loading
            const placesResPromise = fetch(pathToDataFilePlaces, {
                method: 'get',
            });
            const personsPlacesResPromise = fetch(pathToDataFilePersonsPlaces, {
                method: 'get',
            });

            // await first data set, parse from csv to JSON
            const placesRes = await placesResPromise;
            if (!placesRes.ok) {
                throw Error(`Failed to read data from local file ${pathToDataFilePlaces}`);
            }
            const csvStringPlaces = await placesRes.text();
            const dataPlaces = Papa.parse(csvStringPlaces, {header:true, dynamicTyping: true}).data;

            // await second data set (should be ready by now), parse from csv to JSON
            const personsPlacesRes = await personsPlacesResPromise;
            if (!personsPlacesRes.ok) {
                throw Error(`Failed to read data from local file ${pathToDataFilePlaces}`);
            }
            const csvStringPersonsPlaces = await personsPlacesRes.text();
            const dataPersonsPlaces = Papa.parse(csvStringPersonsPlaces, {header:true, dynamicTyping: true}).data;

        
            // create entry in store, adding metadata about the place
            for (const station of dataPlaces) {
                if (!station.stationId) continue;

                const [personsAggregatedDate, sortedDates] = aggregatePersonsPerStationDate(dataPersonsPlaces, station.stationId);

                stations.value[station.stationId] = {
                    stationId: station.stationId, // custom unique name ID without whitespace & punctuation
                    lat: station.lat,
                    long: station.long,
                    wdId: station.wdId,       // wikidata ID
                    altName: station.altName, // alternative / full station name
                    region: station.region,
                    yFounded: station.yFounded,
                    yRenewed: station.yRenewed,
                    personsAggregatedDate: personsAggregatedDate, // 
                    sortedDates: sortedDates

                }

            }

            console.log('Loaded placesStore.');
            console.log(stations.value)
            loaded.value = true

        } catch (error) {
            console.log(error)
            return undefined;
        }
      

      
    }

    
    
  
    return { pathToDataFilePlaces, pathToDataFilePersonsPlaces, readData, stations }
  })