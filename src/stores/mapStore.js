import { defineStore } from 'pinia';

export const useMapStore = defineStore('map', () => {
  const markerBaseSize = 500;
  const markerBaseSizePersonnel = 3;
  const markerBaseSizePopulation = 50;

  // this should be calculated dynamically when importing data
  const dateFirstRecordsPlace = new Date('1828-12-31').getTime();

  return {
    markerBaseSize,
    markerBaseSizePersonnel,
    markerBaseSizePopulation,
    dateFirstRecordsPlace,
  };
});
