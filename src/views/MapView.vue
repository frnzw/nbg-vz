<script setup>
  import Map from '../components/Map.vue';

  /**
   * @component MapView
   * A "View" component that serves as the route-level wrapper for all `/map` pages.
   *
   * Its only job at the moment is to render the <Map> component, which contains the actual content.
   * This follows the "View/Component" pattern. In the future, the Map Component should be stripped of
   * all logic combining other componentes and rendering them according to route. Instead, this logic should be
   * moved into this View component, as that is the better place for combining components in the View/Component pattern.
   * First attempts to achieve this were aborted after experiencing runtime issues with the Leaflet map
   * not being properly accessible on Zoom events (see reverted commit e30d31d24a74bc422f9ddf352a2c379e8f56695e).
   */
</script>

<template>
  <Map />
</template>
