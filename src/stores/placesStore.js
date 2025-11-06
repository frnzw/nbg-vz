import { defineStore } from 'pinia';
import { ref } from 'vue';
import Papa from 'papaparse';

export const usePlacesStore = defineStore('places', () => {
  let loaded = ref(false);
  const pathToDataFilePlaces = `${import.meta.env.BASE_URL}places_vis.csv`;
  const pathToDataFilePersonsPlaces = `${import.meta.env.BASE_URL}persons_places_vis.csv`;
  const pathToDataFilePopulationPlaces = `${import.meta.env.BASE_URL}places_population_vis.csv`;
  const stations = ref({});

  let minPersonnelCountAllStations = ref(1); // have to define a numeric here for vue
  let minPopulationCountAllStations = ref(1);

  function aggregatePersonsPerStationDate(data, stationId) {
    const filteredByStation = data.filter(
      (entry) => entry.stationId === stationId
    );
    // list / count persons present per year
    const grouped = filteredByStation.reduce((acc, entry) => {
      // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);

      if (!acc[d.getTime()]) acc[d.getTime()] = { count: 0, persons: [] };
      acc[d.getTime()].count = acc[d.getTime()].count + 1; // @todo: check if this is used at all
      acc[d.getTime()].persons.push({
        persId: entry.persId,
        choir: entry.choir,
      });

      return acc;
    }, {});

    const minimalCountGreaterZero = Math.min(
      ...Object.keys(grouped)
        .map((date) => {
          return grouped[date].count;
        })
        .filter((count) => count > 0)
    );

    const sortedDates = Object.keys(grouped)
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));
    for (const date of sortedDates) {
      grouped[date].position = sortedDates.indexOf(date); // @todo: check if this is used at all
    }
    return [grouped, sortedDates, minimalCountGreaterZero];
  }

  function extractPopulationPerStationDate(data, stationId) {
    const filteredByStation = data.filter(
      (entry) => entry.stationId === stationId
    );
    // list population present per year
    const population = {};

    const populationCounts = [];
    for (const entry of filteredByStation) {
      // using same fixed day as in Verzeichnis data
      const d = new Date(`${entry.year}-12-31`);
      population[d.getTime()] = {
        pop_1: entry.pop_1,
        pop_2: entry.pop_2,
      };
      if (entry.pop_1) populationCounts.push(entry.pop_1);
      if (entry.pop_2) populationCounts.push(entry.pop_2);
    }

    const minimalCountGreaterZero = Math.min(...populationCounts);

    const sortedDates = Object.keys(population)
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));

    return [population, sortedDates, minimalCountGreaterZero];
  }

  async function readData(
    pathToDataFilePlaces,
    pathToDataFilePersonsPlaces,
    pathToDataFilePopulationPlaces
  ) {
    try {
      // kick off async data loading
      const placesResPromise = fetch(pathToDataFilePlaces, {
        method: 'get',
      });
      const personsPlacesResPromise = fetch(pathToDataFilePersonsPlaces, {
        method: 'get',
      });

      const populationPlacesResPromise = fetch(pathToDataFilePopulationPlaces, {
        method: 'get',
      });

      // await first data set, parse from csv to JSON
      const placesRes = await placesResPromise;
      if (!placesRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePlaces}`
        );
      }
      const csvStringPlaces = await placesRes.text();
      const dataPlaces = Papa.parse(csvStringPlaces, {
        header: true,
        dynamicTyping: true,
      }).data;

      // await second data set (should be ready by now), parse from csv to JSON
      const personsPlacesRes = await personsPlacesResPromise;
      if (!personsPlacesRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePlaces}`
        );
      }
      const csvStringPersonsPlaces = await personsPlacesRes.text();
      const dataPersonsPlaces = Papa.parse(csvStringPersonsPlaces, {
        header: true,
        dynamicTyping: true,
      }).data;

      // await third data set (should be ready by now), parse from csv to JSON
      const populationPlacesRes = await populationPlacesResPromise;
      if (!populationPlacesRes.ok) {
        throw Error(
          `Failed to read data from local file ${populationPlacesResPromise}`
        );
      }
      const csvStringPopulationPlaces = await populationPlacesRes.text();
      const dataPopulationPlaces = Papa.parse(csvStringPopulationPlaces, {
        header: true,
        dynamicTyping: true,
      }).data;

      // create entry in store, adding metadata about the place
      let stationMinPersonelCounts = [];
      let stationMinPopulationCounts = [];
      for (const station of dataPlaces) {
        if (!station.stationId) continue;

        const [personsAggregatedDate, sortedDates, stationMinCountPersonnel] =
          aggregatePersonsPerStationDate(dataPersonsPlaces, station.stationId);

        stationMinPersonelCounts.push(stationMinCountPersonnel);
        const [populationDate, sortedDatesPop, stationMinCountPopulation] =
          extractPopulationPerStationDate(
            dataPopulationPlaces,
            station.stationId
          );
        stationMinPopulationCounts.push(stationMinCountPopulation);

        stations.value[station.stationId] = {
          stationId: station.stationId, // custom unique name ID without whitespace & punctuation
          lat: station.lat,
          long: station.long,
          wdId: station.wdId, // wikidata ID
          altName: station.altName, // alternative / full station name
          region: station.region,
          yFounded: station.yFounded,
          yRenewed: station.yRenewed,

          personsAggregatedDate: personsAggregatedDate, //
          sortedDates: sortedDates,

          populationDate: populationDate,
          sortedDatesPop: sortedDatesPop,
        };
      }

      minPersonnelCountAllStations.value = Math.min(
        ...stationMinPersonelCounts
      );

      minPopulationCountAllStations.value = Math.min(
        ...stationMinPopulationCounts
      );

      loaded.value = true;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  return {
    pathToDataFilePlaces,
    pathToDataFilePersonsPlaces,
    pathToDataFilePopulationPlaces,
    readData,
    stations,
    minPersonnelCountAllStations,
    minPopulationCountAllStations,
    loaded,
  };
});
