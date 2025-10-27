import { defineStore } from "pinia";
import { ref } from "vue";
import Papa from "papaparse";

export const usePersonsStore = defineStore("persons", () => {
  let loaded = ref(false);
  const pathToDataFilePersons = `${import.meta.env.BASE_URL}persons_vis.csv`;
  const pathToDataFilePersonsPlaces = `${import.meta.env.BASE_URL}persons_places_vis.csv`;
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
    const filteredByPerson = data.filter((entry) => entry.persId === personId);
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

    const sortedDates = Object.keys({ ...stationsByDate })
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));
    return [stationsByDate, sortedDates];
  }

  function extractChoirPerPersonDate(data, personId) {
    const filteredByPerson = data.filter((entry) => entry.persId === personId);
    const choirByDate = filteredByPerson.reduce((acc, entry) => {
      // build date from year, assuming year-12-31 for NBG-VZ data (source specifies only as "end of year")
      const d = new Date(`${entry.year}-12-31`);

      // if date already exists, use the existing entries for choir, else create them for the date
      acc[d.getTime()] = { date: d, choir: entry.choir };
      return acc;
    }, {});

    const sortedDatesChoir = Object.keys({ ...choirByDate })
      .sort((a, b) => a - b)
      .map((d) => parseInt(d));

    return [choirByDate, sortedDatesChoir];
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
        const idx = Object.keys(acc[entry.stationId].stays).map((k) => {
          return parseInt(k);
        });
        const idxMax = Math.max(...idx);
        // check if person stays in same place
        if (
          acc[entry.stationId].stationId ===
          orderedStationsAggr[orderedStationsAggr.length - 1].stationId
        ) {
          // -> update .dateTo of most recent stay
          acc[entry.stationId].stays[idxMax].dateTo = d.getTime();
        } else {
          // -> add new subentry to acc with stationId+_count
          acc[entry.stationId].stays[idxMax + 1] = {
            dateFrom: d.getTime(),
            dateTo: d.getTime(),
          };
          orderedStationsAggr.push({
            stationId: entry.stationId,
            stayIdx: idxMax + 1,
          });
        }
      } else {
        // create inital acc entry
        acc[entry.stationId] = {
          stationId: entry.stationId,
          lat: entry.lat,
          long: entry.long,
        };

        acc[entry.stationId].stays = {
          0: {
            dateFrom: d.getTime(),
            dateTo: d.getTime(),
          },
        };

        orderedStationsAggr.push({ stationId: entry.stationId, stayIdx: 0 });
      }
      return acc;
    }, {});

    return [orderedStationsAggr, groupedStationsAggr];
  };

  async function readData(pathToDataFilePersons, pathToDataFilePersonsPlaces) {
    try {
      // kick off async data loading
      const personsResPromise = fetch(pathToDataFilePersons, {
        method: "get",
      });

      const personsPlacesResPromise = fetch(pathToDataFilePersonsPlaces, {
        method: "get",
      });

      // await first data set, parse from csv to JSON
      const personsRes = await personsResPromise;
      if (!personsRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePersons}`,
        );
      }
      const csvStringPersons = await personsRes.text();
      const dataPersons = Papa.parse(csvStringPersons, {
        header: true,
        dynamicTyping: true,
      }).data;

      // await second data set (should be ready by now), parse from csv to JSON
      const personsPlacesRes = await personsPlacesResPromise;
      if (!personsPlacesRes.ok) {
        throw Error(
          `Failed to read data from local file ${pathToDataFilePersonsPlaces}`,
        );
      }
      const csvStringPersonsPlaces = await personsPlacesRes.text();
      const dataPersonsPlaces = Papa.parse(csvStringPersonsPlaces, {
        header: true,
        dynamicTyping: true,
      }).data;

      // create entry in store, adding metadata about the place
      for (const person of dataPersons) {
        if (!person.persId) continue;

        // some aggregation
        // different structures for same data – redundant, but saves time filtering / aggregation
        // for interaction / animations
        // these redundant structures should come from a backend in the future, only being loaded here
        const [stationsByDate, sortedDatesStation] =
          extractStationsPerPersonDate(dataPersonsPlaces, person.persId);
        const [choirByDate, sortedDatesChoir] = extractChoirPerPersonDate(
          dataPersonsPlaces,
          person.persId,
        );
        const [orderedStationsAggr, groupedStationsAggr] = aggregateStations(
          dataPersonsPlaces,
          person.persId,
        );

        persons.value[person.persId] = {
          persId: person.persId,
          wdId: person.wdId,
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

      console.log("Loaded personsStore");

      loaded.value = true;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  return {
    pathToDataFilePersons,
    pathToDataFilePersonsPlaces,
    readData,
    loaded,
    persons,
  };
});
