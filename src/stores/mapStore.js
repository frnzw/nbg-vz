import { defineStore } from 'pinia'
import {ref} from 'vue'

export const useMapStore = defineStore('map', () => {

    const markerBaseSize = 500;
  
    return { markerBaseSize }

});