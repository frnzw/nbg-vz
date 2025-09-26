
<script setup>
import { ref } from 'vue'
const props = defineProps({
  modelValue: Number,
})


const sliderValue = ref(props.modelValue) // suppress warning that props are read only, indirectly bind to slider v-model via this local var
const emit = defineEmits(["update:modelValue"])

const start = 1800
const end = 1900
let isPlaying = ref(false)

const playBack = async function() {
  while (isPlaying.value === true) {
      if (sliderValue.value === end) {
        sliderValue.value = start
      } else {
        sliderValue.value = sliderValue.value + 1

      }
      console.log(`sliderValue.value === ${sliderValue.value}`)
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 1000)
      })
    }
    console.log('Ending Playback')
}

const togglePlay = function() {
    isPlaying.value = !isPlaying.value
    console.log(`isPlaying === ${isPlaying.value}`)
    if (isPlaying) playBack(isPlaying)
}

</script>

<template>

      <v-slider
      v-model="sliderValue" 
      @update:modelValue="val => emit('update:modelValue', val)"
      :min="start"
      :max="end"
      label="Jahr"
      step=1
      thumb-label="always">

      <template v-slot:append>
          <v-btn
            :color="color"
            icon="mdi-plus"
            size="small"
            variant="text"
            @click="togglePlay"
          ></v-btn>
        </template>
     </v-slider>


</template>
