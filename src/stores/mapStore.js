import { defineStore } from 'pinia';

export const useMapStore = defineStore('map', () => {
  const markerBaseSize = 500;
  const markerBaseSizePersonnel = 3;
  const markerBaseSizePopulation = 50;

  return { markerBaseSize, markerBaseSizePersonnel, markerBaseSizePopulation };
});
