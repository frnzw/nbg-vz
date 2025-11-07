import { defineStore } from 'pinia';

/**
 * Store for map-related configuration and constants.
 */
export const useMapStore = defineStore('map', () => {
  /**
   * @type {number}
   * Base size for generic map markers.
   */
  const markerBaseSize = 500;

  /**
   * @type {number}
   * Base size for markers representing personnel.
   */
  const markerBaseSizePersonnel = 3;

  /**
   * @type {number}
   * Base size for markers representing population.
   */
  const markerBaseSizePopulation = 50;

  /**
   * @type {number}
   * Timestamp of the earliest known record.
   * This is used as the starting point for time-based calculations.
   * @todo Should rather be calculated dynamically when importing data.
   */
  const dateFirstRecordsPlace = new Date('1828-12-31').getTime();

  /**
   * @type {string}
   * The URL for the Stadia Maps tile stylesheet (Alidade Smooth).
   */
  const stadiaStyleUrl =
    'https://tiles.stadiamaps.com/styles/alidade_smooth.json';

  /**
   * @type {string | undefined}
   * The Stadia Maps API key, loaded from environment variable VITE_STADIA_API_KEY.
   * Has to be be added locally in dev mode.
   */

  const localApiKey = import.meta.env.VITE_STADIA_API_KEY;

  return {
    markerBaseSize,
    markerBaseSizePersonnel,
    markerBaseSizePopulation,
    dateFirstRecordsPlace,
    stadiaStyleUrl,
    localApiKey,
  };
});
