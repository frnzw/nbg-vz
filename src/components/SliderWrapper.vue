
<script setup>
import { ref } from 'vue'
const props = defineProps({
  modelValue: Number,
})

const sliderValue = ref(props.modelValue) // suppress warning that props are read only, indirectly bind to slider v-model via this local var
const emit = defineEmits(["update:modelValue"])
</script>

<template>
  <v-slider
    v-model="sliderValue" 
    @update:modelValue="val => emit('update:modelValue', val)"
    min="1800"
    max="1900"
    label="Jahr"
    step=1
    thumb-label="always"

  />
</template>
