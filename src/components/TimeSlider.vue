<script setup>
  import { ref, watch } from 'vue';

  /**
   * The current value of the slider, bound via v-model.
   * Expected to be a Unix timestamp (number).
   * @type {Number}
   */
  const props = defineProps({
    modelValue: Number,
  });

  // --- Constants ---

  /**
   * @type {number}
   * Timestamp for the conceptual start of the timeline (used for playback loop).
   */
  // have to use timestamps here, since vuetify slider only works with numbers
  const start = new Date('1800-01-01').getTime();

  /**
   * @type {number}
   * Timestamp for the conceptual end of the timeline (used for playback loop).
   */
  const end = new Date('1900-01-01').getTime();

  /**
   * @type {import('vue').Ref<boolean>}
   * Reactive state tracking whether the timeline playback is active.
   */
  let isPlaying = ref(false);

  /**
   * @type {import('vue').Ref<number>}
   * Local reactive reference for the v-slider's v-model.
   * This is used to watch for changes and emit updates,
   * effectively synchronizing with the `modelValue` prop.
   * Avoids warning that props are read only.
   */
  const sliderValue = ref(props.modelValue);

  /**
   * Defines the component's emitted events.
   * @event update:modelValue
   * Emits the new timestamp value when the slider changes, enabling v-model.
   */
  const emit = defineEmits(['update:modelValue']);

  /**
   * @type {Array<number>}
   * An array of timestamps, one for the end of each year between 1800 and 1900.
   * These are used as the discrete steps (ticks) for the slider.
   */
  const ticks = [];
  // Generate ticks for 100 years, starting from 1800
  for (const offset of [...Array(100).keys()]) {
    // Set the tick to the last day of the year
    const tick = new Date(`${1800 + offset}-12-31`).getTime();
    ticks.push(tick);
  }

  /**
   * Watches the local `sliderValue` for changes (e.g., from the user dragging).
   * It "snaps" the value to the nearest defined tick and then emits the
   * `update:modelValue` event to the parent.
   * @param {number} val - The new, "raw" value from the slider.
   */
  watch(sliderValue, (val) => {
    // Check if the current value is *not* one of the pre-defined ticks
    if (!ticks.includes(val)) {
      // Find the closest tick in the array
      const closestTick = ticks.reduce((a, b) =>
        Math.abs(b - val) < Math.abs(a - val) ? b : a
      );
      // Snap the slider's value to that closest tick
      sliderValue.value = closestTick;
    }
    // Emit the (potentially snapped) value to the parent
    emit('update:modelValue', sliderValue.value);
  });

  /**
   * Formats a timestamp value for display in the slider's thumb label.
   * @param {number} val - The timestamp to format.
   * @returns {string} The formatted date string (e.g., "1850-12").
   */
  function formatThumbLabel(val) {
    const d = new Date(val);
    // Format as YYYY-M (e.g., "1850-1" for January 1850)
    return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString();
  }

  /**
   * Asynchronously advances the slider by one year every second
   * as long as `isPlaying` is true.
   * @returns {Promise<void>}
   */
  const playBack = async function () {
    // Loop continues as long as the play button is active
    while (isPlaying.value === true) {
      // Calculate the next year's timestamp (approximately)
      const newValue = sliderValue.value + 365 * 24 * 60 * 60 * 1000;

      // If the new value goes past the end, loop back to the start
      if (newValue >= end) {
        sliderValue.value = start;
        continue; // Skip the rest of the loop and start over
      }

      // Snap the calculated new value to the nearest tick
      if (!ticks.includes(newValue)) {
        const closestTick = ticks.reduce((a, b) =>
          Math.abs(b - newValue) < Math.abs(a - newValue) ? b : a
        );
        sliderValue.value = closestTick;
      } else {
        sliderValue.value = newValue;
      }

      // Emit the update so the parent component reacts
      emit('update:modelValue', sliderValue.value);

      // Wait for 1 second before the next step
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }
    // console.log('Ending Playback')
  };

  /**
   * Toggles the playback state (playing/paused).
   * Kicks off the `playBack` loop. The loop itself will check
   * `isPlaying.value` and either run or terminate.
   */
  const togglePlay = function () {
    isPlaying.value = !isPlaying.value;

    if (isPlaying.value) playBack();
  };
</script>

<template>
  <v-slider
    v-model="sliderValue"
    :min="ticks[0]"
    :max="ticks[ticks.length - 1]"
    label="Jahr"
    thumb-label="always"
    :tick-labels="ticks"
    show-ticks="always"
  >
    <!-- Customizes the display of the thumb label -->
    <template v-slot:thumb-label="{ modelValue }">
      {{ formatThumbLabel(modelValue) }}
    </template>
    <!-- Adds a play/pause button to the end of the slider -->
    <template v-slot:append>
      <v-btn
        :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
        size="small"
        variant="text"
        @click="togglePlay"
      ></v-btn>
    </template>
  </v-slider>
</template>
