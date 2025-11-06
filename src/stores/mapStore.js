import { defineStore } from 'pinia';

export const useMapStore = defineStore('map', () => {
  const markerBaseSize = 500;
  const markerBaseSizePersonnel = 3;
  const markerBaseSizePopulation = 50;

  // this should be calculated dynamically when importing data
  const dateFirstRecordsPlace = new Date('1828-12-31').getTime();

  const stadiaStyleUrl =
    'https://tiles.stadiamaps.com/styles/alidade_smooth.json';

  // has to be be added locally in dev mode
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
