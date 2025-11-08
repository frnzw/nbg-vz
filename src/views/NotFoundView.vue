<script setup>
  import NotFound from '../components/NotFound.vue';

  /**
   * @component NotFoundView
   * A "View" component that serves as the route-level wrapper for the 404 page.
   *
   * Its only job is to render the <NotFound> component, which contains the actual UI.
   * This follows the "View/Component" pattern.
   */
</script>

<template>
  <!-- Render the main 404 (Not Found) component -->
  <NotFound />
</template>
