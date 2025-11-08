<script setup>
  import About from '../components/About.vue';

  /**
   * @component AboutView
   * A "View" component that serves as the route-level wrapper for the `/about` page.
   *
   * Its only job is to render the <About> component, which contains the actual content.
   * This follows the "View/Component" pattern.
   */
</script>

<template>
  <!-- Render the main About component -->
  <About />
</template>
