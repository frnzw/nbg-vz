<script setup>
    import { ref } from 'vue'
    const min = ref(1800)
    const max = ref(1900)
    const slider = ref(1819)
</script>

<template>
    <!-- <div class="position-relative" style="width: 100%; height: 50px; border: 2px solid black"> -->
        <v-slider v-model="slider" :max="max" :min="min"style="width:25%">
        </v-slider>
    <!-- </div> -->

    <!-- <div class="bg-surface-variant pa-4 position-relative rounded-lg ma-2 z-index-1000">
    <div class="bg-surface-light position-relative pa-3 pb-16">
      <div class="mb-2">Relative parent</div>

      <div class="position-absolute bottom-1 right-1 bg-primary rounded-lg pa-3">
        Absolute child
      </div>
    </div>
  </div> -->
</template>