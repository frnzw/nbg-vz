import { defineStore } from "pinia";

export const useMapStore = defineStore("map", () => {
  const markerBaseSize = 500;

  return { markerBaseSize };
});
