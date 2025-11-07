import { defineStore } from 'pinia';
import { ref } from 'vue';
import Papa from 'papaparse';

/**
 * Store for managing place (station) data, including personnel counts and population
 * data over time. This store handles fetching, parsing, and aggregating data from CSV files.
 */
export const usePlacesStore = defineStore('places', () => {
  /**
   * @type {import('vue').Ref<boolean>}
   * Tracks whether the place data has been successfully loaded.
   */
  let loaded = ref(false);

  /**
   * @type {string}
   * Path to the main places (stations) data file.
   */
  const pathToDataFilePlaces = `${import.meta.env.BASE_URL}places_vis.csv`;

  /**
   * @type {string}
   * Path to the file linking persons to places.
   */
  const pathToDataFilePersonsPlaces = `${
    import.meta.env.BASE_URL
  }persons_places_vis.csv`;

  /**
   * @type {string}
   * Path to the file containing population data for places.
   */
  const pathToDataFilePopulationPlaces = `${
    import.meta.env.BASE_URL
  }places_population_vis.csv`;

  /**
   * @type {import('vue').Ref<Object<string, Object>>}
   * A reactive object holding all station data, indexed by `stationId`.
   * Each station object contains aggregated and processed data.
   */
  const stations = ref({});

  /**
   * @type {import('vue').Ref<number>}
   * The minimum personnel count found across all stations and dates. Necessary for calculating marker size later on.
   * Initialized to 1 as a placeholder.
   */
  let minPersonnelCountAllStations = ref(1); // have to define a numeric here for vue

  /**
   * @type {import('vue').Ref<number>}
   * The minimum population count found across all stations and dates. Necessary for calculating marker size later on.
   * Initialized to 1 as a placeholder.
   */
  let minPopulationCountAllStations = ref(1);

  /**
   * Aggregates person data for a specific station, grouping by date.
   * @param {Array<Object>} data - The raw data parsed from the persons_places_vis.csv file.
   * @param {string | number} stationId - The ID of the station to aggregate data for.
   * @returns {Array<[Object<number, Object>, Array<number>, number]>}
   * An array containing three elements:
   * 1. `grouped`: An object mapping timestamps to aggregated data ({ count, persons: [...] }).
   * 2. `sortedDates`: An array of sorted timestamps (as numbers).
   * 3. `minimalCountGreaterZero`: The minimum personnel count > 0 recorded for this station.
   */
  function aggregatePersonsPerStationDate(data, stationId) {
    const filteredByStation = data.filter(
      (entry) => entry.stationId === stationId
    );

    // list / count persons present per year
    const grouped = filteredByStation.reduce((acc, entry) => {
      // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);
      const timestamp = d.getTime();

      // Initialize the entry for this date if it doesn't exist
      if (!acc[timestamp]) acc[timestamp] = { count: 0, persons: [] };

      // Increment count and add person details
      acc[timestamp].count = acc[timestamp].count + 1; // @todo: check if this is used at all
      acc[timestamp].persons.push({
        persId: entry.persId,
        choir: entry.choir,
      });

      return acc;
    }, {});

    // Find the smallest non-zero personnel count for this station
    const minimalCountGreaterZero = Math.min(
      ...Object.keys(grouped)
        .map((date) => {
          return grouped[date].count;
        })
        .filter((count) => count > 0)
    );

    // Get a sorted list of dates for chronological access
    const sortedDates = Object.keys(grouped)
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));

    // Add a 'position' index to each date entry (e.g., for timeline sequencing)
    for (const date of sortedDates) {
      grouped[date].position = sortedDates.indexOf(date); // @todo: check if this is used at all
    }
    return [grouped, sortedDates, minimalCountGreaterZero];
  }

  /**
   * Extracts population data for a specific station, grouping by date.
   * @param {Array<Object>} data - The raw data parsed from the places_population_vis.csv file.
   * @param {string | number} stationId - The ID of the station to extract data for.
   * @returns {Array<[Object<number, Object>, Array<number>, number]>}
   * An array containing three elements:
   * 1. `population`: An object mapping timestamps to population data ({ pop_1, pop_2 }).
   * 2. `sortedDates`: An array of sorted timestamps (as numbers).
   * 3. `minimalCountGreaterZero`: The minimum population count > 0 recorded for this station.
   */
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
        pop_1: entry.pop_1, // Count of full members only
        pop_2: entry.pop_2, // Count of residents affiliated with the station
      };
      // Collect all non-null counts to find the minimum
      if (entry.pop_1) populationCounts.push(entry.pop_1);
      if (entry.pop_2) populationCounts.push(entry.pop_2);
    }

    // Find the smallest non-zero population count
    const minimalCountGreaterZero = Math.min(...populationCounts);

    // Get a sorted list of dates for chronological access
    const sortedDates = Object.keys(population)
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));

    return [population, sortedDates, minimalCountGreaterZero];
  }

  /**
   * Fetches, parses, and processes all place-related data from CSV files.
   * Populates the `stations` ref and sets `loaded` to true.
   * @param {string} pathToDataFilePlaces - Path to the places CSV.
   * @param {string} pathToDataFilePersonsPlaces - Path to the persons-places CSV.
   * @param {string} pathToDataFilePopulationPlaces - Path to the population-places CSV.
   * @returns {Promise<void>}
   */
  async function readData(
    pathToDataFilePlaces,
    pathToDataFilePersonsPlaces,
    pathToDataFilePopulationPlaces
  ) {
    try {
      // kick off async data loading for all three files in parallel
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
      // Use PapaParse to convert CSV string to JSON
      const dataPlaces = Papa.parse(csvStringPlaces, {
        header: true,
        dynamicTyping: true, // Automatically convert types
      }).data;

      // await second data set (should be ready by now), parse from csv to JSON
      const personsPlacesRes = await personsPlacesResPromise;
      if (!personsPlacesRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePersonsPlaces}`
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
          `Failed to read data from local file ${pathToDataFilePopulationPlaces}`
        );
      }
      const csvStringPopulationPlaces = await populationPlacesRes.text();
      const dataPopulationPlaces = Papa.parse(csvStringPopulationPlaces, {
        header: true,
        dynamicTyping: true,
      }).data;

      // --- Data Aggregation ---
      // create entry in store, adding metadata about the place
      let stationMinPersonelCounts = [];
      let stationMinPopulationCounts = [];

      // Process each station from the main places file
      for (const station of dataPlaces) {
        // Skip empty rows or rows without a stationId
        if (!station.stationId) continue;

        // 1. Aggregate personnel data for this station
        const [personsAggregatedDate, sortedDates, stationMinCountPersonnel] =
          aggregatePersonsPerStationDate(dataPersonsPlaces, station.stationId);

        stationMinPersonelCounts.push(stationMinCountPersonnel);

        // 2. Extract population data for this station
        const [populationDate, sortedDatesPop, stationMinCountPopulation] =
          extractPopulationPerStationDate(
            dataPopulationPlaces,
            station.stationId
          );

        stationMinPopulationCounts.push(stationMinCountPopulation);

        // 3. Populate the stations ref with all processed data
        stations.value[station.stationId] = {
          stationId: station.stationId, // custom unique name ID without whitespace & punctuation
          lat: station.lat,
          long: station.long,
          wdId: station.wdId, // wikidata ID
          altName: station.altName, // alternative / full station name
          region: station.region,
          yFounded: station.yFounded,
          yRenewed: station.yRenewed,

          // Aggregated personnel data
          personsAggregatedDate: personsAggregatedDate,
          sortedDates: sortedDates,

          // Extracted population data
          populationDate: populationDate,
          sortedDatesPop: sortedDatesPop,
        };
      }

      // Calculate the global minimums for all stations
      minPersonnelCountAllStations.value = Math.min(
        ...stationMinPersonelCounts
      );

      minPopulationCountAllStations.value = Math.min(
        ...stationMinPopulationCounts
      );

      // Signal that data loading is complete
      loaded.value = true;
    } catch (error) {
      console.error('Error reading or parsing data:', error);
      // Don't set loaded to true, so UI can show an error or loading state
      return undefined;
    }
  }

  return {
    /**
     * @type {string}
     * Path to the main places (stations) data file.
     */
    pathToDataFilePlaces,
    /**
     * @type {string}
     * Path to the file linking persons to places.
     */
    pathToDataFilePersonsPlaces,
    /**
     * @type {string}
     * Path to the file containing population data for places.
     */
    pathToDataFilePopulationPlaces,
    /**
     * @type {Function}
     * Kicks off the data loading and processing.
     */
    readData,
    /**
     * @type {import('vue').Ref<Object<string, Object>>}
     * The reactive object holding all processed station data, indexed by `stationId`.
     */
    stations,
    /**
     * @type {import('vue').Ref<number>}
     * The global minimum personnel count found across all stations.
     */
    minPersonnelCountAllStations,
    /**
     * @type {import('vue').Ref<number>}
     * The global minimum population count found across all stations.
     */
    minPopulationCountAllStations,
    /**
     * @type {import('vue').Ref<boolean>}
     * A reactive boolean indicating if data has finished loading.
     */
    loaded,
  };
});
