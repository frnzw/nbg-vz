import { defineStore } from 'pinia';
import { ref } from 'vue';
import Papa from 'papaparse';

/**
 * Store for managing person data, including their stations and choir affiliations over time.
 * This store handles fetching, parsing, and aggregating data from CSV files.
 *
 * Import, parsing, extraction functions are specific to different datasets.
 */
export const usePersonsStore = defineStore('persons', () => {
  /**
   * @type {import('vue').Ref<boolean>}
   * Tracks whether the person data has been successfully loaded.
   */
  let loaded = ref(false);

  /**
   * @type {string}
   * Path to the persons data file.
   */
  const pathToDataFilePersons = `${import.meta.env.BASE_URL}persons_vis.csv`;

  /**
   * @type {string}
   * Path to the file linking persons to places (stations).
   */
  const pathToDataFilePersonsPlaces = `${import.meta.env.BASE_URL}persons_places_vis.csv`;

  /**
   * @type {import('vue').Ref<Object<string, Object>>}
   * Main data of this store.
   * A reactive object holding all person data, indexed by `persId`.
   * Each person object contains aggregated and processed data for quick access.
   */
  const persons = ref({});

  /**
   * Extract a person's recorded stations by date, dictionary style.
   * @param {Array<Object>} data - The raw data parsed from the persons_places_vis.csv file.
   * @param {string | number} personId - The ID of the person to extract data for.
   * @returns {Array<[Object<number, Object>, Array<number>]>}
   * An array containing two elements:
   * 1. An object mapping timestamps to station data ({ date, stationId, lat, long }).
   * 2. An array of sorted timestamps (as numbers).
   */
  function extractStationsPerPersonDate(data, personId) {
    const filteredByPerson = data.filter((entry) => entry.persId === personId);

    // Reduce the filtered data into an object keyed by timestamp
    const stationsByDate = filteredByPerson.reduce((acc, entry) => {
      // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);

      // if date already exists, use the existing entries for station, else create them for the date
      acc[d.getTime()] = {
        date: d,
        stationId: entry.stationId,
        lat: entry.lat,
        long: entry.long,
      };

      return acc;
    }, {});

    // Create a sorted list of dates for chronological access
    const sortedDates = Object.keys({ ...stationsByDate })
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));
    return [stationsByDate, sortedDates];
  }

  /**
   * Extracts a person's recorded choir affiliations by date.
   * @param {Array<Object>} data - The raw data parsed from the persons_places_vis.csv file.
   * @param {string | number} personId - The ID of the person to extract data for.
   * @returns {Array<[Object<number, Object>, Array<number>]>}
   * An array containing two elements:
   * 1. An object mapping timestamps to choir data ({ date, choir }).
   * 2. An array of sorted timestamps (as numbers).
   */
  function extractChoirPerPersonDate(data, personId) {
    const filteredByPerson = data.filter((entry) => entry.persId === personId);

    // Reduce the filtered data into an object keyed by timestamp
    const choirByDate = filteredByPerson.reduce((acc, entry) => {
      // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);

      // if date already exists, use the existing entries for choir, else create them for the date
      acc[d.getTime()] = { date: d, choir: entry.choir };
      return acc;
    }, {});

    // Create a sorted list of dates for chronological access
    const sortedDatesChoir = Object.keys({ ...choirByDate })
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));

    return [choirByDate, sortedDatesChoir];
  }

  /**
   * Aggregate a person's recorded stations, summing up consecutive records for the same station to
   *  a stay from...to... .
   *
   * @param {Array<Object>} data - The raw data parsed from the persons_places_vis.csv file.
   * @param {string | number} personId - The ID of the person to aggregate data for.
   * @returns {Array<[Array<Object>, Object<string, Object>]>}
   * An array containing two elements:
   * 1. `orderedStationsAggr`: An array of objects ({ stationId, stayIdx }) representing stays in chronological order.
   * 2. `groupedStationsAggr`: An object mapping `stationId` to aggregated data, including a `stays` object.
   */
  const aggregateStations = function (data, personId) {
    // first: stations per person, ordered by date
    const filteredByPerson = data
      .filter((entry) => entry.persId === personId)
      .sort((a, b) => a.year - b.year);
    // aggregate further:
    const orderedStationsAggr = [];
    const groupedStationsAggr = filteredByPerson.reduce((acc, entry) => {
      // build date from year, assuming year-11-01 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);

      // station was visited before
      if (acc[entry.stationId]) {
        // Get all stay indices for the current station
        const idx = Object.keys(acc[entry.stationId].stays).map((k) => {
          return parseInt(k);
        });
        const idxMax = Math.max(...idx); // Find the most recent stay index
        // check if person stays in same place (is the last recorded station the same as the current one?)
        if (
          acc[entry.stationId].stationId ===
          orderedStationsAggr[orderedStationsAggr.length - 1].stationId
        ) {
          // -> update .dateTo of most recent stay
          acc[entry.stationId].stays[idxMax].dateTo = d.getTime();
        } else {
          // -> Person returned to this station after being somewhere else.
          // -> Add new subentry to acc.stays
          acc[entry.stationId].stays[idxMax + 1] = {
            dateFrom: d.getTime(),
            dateTo: d.getTime(),
          };
          // Log this new stay in the chronological list
          orderedStationsAggr.push({
            stationId: entry.stationId,
            stayIdx: idxMax + 1,
          });
        }
      } else {
        // -> This is the first time the person is recorded at this station.
        // -> create inital acc entry
        acc[entry.stationId] = {
          stationId: entry.stationId,
          lat: entry.lat,
          long: entry.long,
        };

        // Create the first stay record for this station
        acc[entry.stationId].stays = {
          0: {
            dateFrom: d.getTime(),
            dateTo: d.getTime(),
          },
        };

        // Log this first stay in the chronological list
        orderedStationsAggr.push({ stationId: entry.stationId, stayIdx: 0 });
      }
      return acc;
    }, {});

    return [orderedStationsAggr, groupedStationsAggr];
  };

  /**
   * Fetches, parses, and processes all person-related data from CSV files.
   * Populates the `persons` ref and sets `loaded` to true.
   * @param {string} pathToDataFilePersons - Path to the persons CSV.
   * @param {string} pathToDataFilePersonsPlaces - Path to the persons-places CSV.
   * @returns {Promise<void>}
   */
  async function readData(pathToDataFilePersons, pathToDataFilePersonsPlaces) {
    try {
      // kick off async data loading
      const personsResPromise = fetch(pathToDataFilePersons, {
        method: 'get',
      });

      const personsPlacesResPromise = fetch(pathToDataFilePersonsPlaces, {
        method: 'get',
      });

      // await first data set, parse from csv to JSON
      const personsRes = await personsResPromise;
      if (!personsRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePersons}`
        );
      }
      const csvStringPersons = await personsRes.text();

      // Use PapaParse to convert CSV string to JSON
      const dataPersons = Papa.parse(csvStringPersons, {
        header: true,
        dynamicTyping: true,
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

      // create entry in store, adding metadata about the place
      for (const person of dataPersons) {
        // Skip rows that are empty or don't have a person ID
        if (!person.persId) continue;

        // --- Data Aggregation ---
        // Pre-calculate and store different data structures for performance.
        // This avoids costly filtering and aggregation during user interaction.
        // these redundant structures should come from a backend in the future, only being loaded here

        // 1. Stations by date (for timeline)
        const [stationsByDate, sortedDatesStation] =
          extractStationsPerPersonDate(dataPersonsPlaces, person.persId);

        // 2. Choir by date (for timeline)
        const [choirByDate, sortedDatesChoir] = extractChoirPerPersonDate(
          dataPersonsPlaces,
          person.persId
        );

        // 3. Aggregated stays (for "Traces" View, avoiding duplicate markers and trace symbols)
        const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(
          dataPersonsPlaces,
          person.persId
        );

        // Populate the persons ref with the processed data
        persons.value[person.persId] = {
          persId: person.persId,
          wdId: person.wdId, // Wikidata ID
          familyName: person.familyName,
          birthName: person.birthName,
          givenName: person.givenName,
          widowed: person.widowed,
          gender: person.gender,
          stationsDate: stationsByDate,
          sortedDatesStation: sortedDatesStation,
          choirDate: choirByDate,
          sortedDatesChoir: sortedDatesChoir,
          groupedStationsAggr: groupedStationsAggr,
          orderedStationsAggr: orderedStationsAggr,
        };
      }

      // Signal that data loading is complete
      loaded.value = true;
    } catch (error) {
      console.error(error);
      // Don't set loaded to true, so UI can show an error or loading state
      return undefined;
    }
  }

  return {
    /**
     * @type {string}
     * Path to the persons data file.
     */
    pathToDataFilePersons,
    /**
     * @type {string}
     * Path to the file linking persons to places (stations).
     */
    pathToDataFilePersonsPlaces,
    /**
     * @type {Function}
     * Kicks off the data loading and processing.
     */
    readData,
    /**
     * @type {import('vue').Ref<boolean>}
     * A reactive boolean indicating if data has finished loading.
     */
    loaded,
    /**
     * @type {import('vue').Ref<Object<string, Object>>}
     * The reactive object holding all processed person data, indexed by `persId`.
     */
    persons,
  };
});
