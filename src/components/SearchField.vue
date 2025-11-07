<script setup>
  import { defineProps, ref } from 'vue';

  /**
   * Defines the component's props.
   */
  const props = defineProps({
    /**
     * The name of the facet (e.g., "Station-ID", "Person-ID").
     * Used for the input label.
     * @type {String}
     */
    facet: String,
    /**
     * The array of available items for this facet (e.g., ['Station A', 'Station B']).
     * @type {Array<String | Object>}
     */
    facetData: Array,
    /**
     * The currently selected values, bound via v-model.
     * @type {Array<String>}
     */
    modelValue: Array,
  });

  /**
   * @type {import('vue').Ref<Array<String>>}
   * Local reactive reference for the v-autocomplete's v-model.
   * This synchronizes with the `modelValue` prop.
   * Avoids warning that props are read only.
   */
  const selectedValues = ref(props.modelValue);

  /**
   * Defines the component's emitted events.
   * @event update:modelValue
   * Emits the new array of selected values when the selection changes.
   */
  const emit = defineEmits(['update:modelValue']);
</script>
<template>
  <v-autocomplete
    v-model="selectedValues"
    @update:modelValue="(val) => emit('update:modelValue', val)"
    clearable
    chips
    :label="`Durchsuche ${facet}...`"
    :items="facetData"
    multiple
  >
  </v-autocomplete>
</template>
