<script setup>
  import { onMounted, ref, watch } from 'vue';
  import 'leaflet/dist/leaflet.css';
  import 'maplibre-gl/dist/maplibre-gl.css';

  import L from 'leaflet';
  import '@maplibre/maplibre-gl-leaflet';

  // Import Vue Router and helpers
  import { createInfobox } from '../mapHelpers';
  import { useMapStore } from '../stores/mapStore';

  // --- Store, Router, and Emit Setup ---

  /**
   * @type {import('pinia').Store}
   * The Pinia store for map configuration.
   */
  const mapStore = useMapStore();

  const emit = defineEmits(['map-ready']);

  // --- Map Initialization ---

  /**
   * @type {string}
   * The URL for the Stadia Maps style.
   */
  let stadiaStyleUrl = mapStore.stadiaStyleUrl;

  /**
   * Initializes the Leaflet map, adds the MapLibre GL vector layer,
   * and creates the infobox control.
   * Sets `globalMap`, `globalInfoBox`, and `mapReady`.
   */
  const initMap = function () {
    const map = L.map('mapContainer').fitWorld().zoomIn();

    if (import.meta.env.DEV) {
      // local development requires stadia API key to avoid suspension when hitting tile rate limits
      stadiaStyleUrl = `${stadiaStyleUrl}?api_key=${mapStore.localApiKey}`;
    } else {
      // deployment uses domain name authentication
    }

    // Initialize the MapLibre GL layer
    const vectorLayer = L.maplibreGL({
      style: stadiaStyleUrl,
    });

    vectorLayer.addTo(map);

    // add infobox (without any content at this point)
    const info = createInfobox();
    info.addTo(map);

    // Emit the map and infobox objects to the parent view
    emit('map-ready', map, info);
  };

  /**
   * On component mount, initialize the map and set up the layer rendering logic.
   */
  onMounted(() => {
    initMap();
  });
</script>

<template>
  <!-- The div where the Leaflet map is mounted -->
  <div id="mapContainer"></div>
</template>

<style scoped>
  #mapContainer {
    width: 100vw;
    height: 90%;
  }
</style>
