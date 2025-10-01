
<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  modelValue: Number,
})

// have to use timestamps here, since vuetify slider only works with numbers
const start = new Date("1800-01-01").getTime()
const end = new Date("1900-01-01").getTime()
let isPlaying = ref(false)

// console.log(`slider start: ${start}`)
// console.log(`slider end: ${end}`)

const sliderValue = ref(props.modelValue) // suppress warning that props are read only, indirectly bind to slider v-model via this local var
const emit = defineEmits(["update:modelValue"])

const ticks = [];
for (const offset of [...Array(100).keys()]) {
  const tick = new Date(`${1800 + offset}-11-01`).getTime()
  ticks.push(tick)
}
console.log(ticks)


// choose closest tick instead of real value – emit update here, not on update event itself
watch(sliderValue, (val) => {
  if (!ticks.includes(val)) {
    const closestTick = ticks.reduce((a, b) => Math.abs(b - val) < Math.abs(a - val) ? b : a)
    sliderValue.value = closestTick
  }
  emit('update:modelValue', sliderValue.value)
})

// console.log(tickLabels)
// converting back timestamps for displaying
function formatThumbLabel(val) {
  // console.log(val)
  const d = new Date(val)
  // console.log(d)
  // console.log(`extracted date: ${d}`)
  return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString()
}

const playBack = async function() {
  while (isPlaying.value === true) {
      if (sliderValue.value === end) {
        sliderValue.value = start
      } else {
        const newValue = sliderValue.value + 365 * 24 * 60 * 60 * 1000
        if (!ticks.includes(newValue)) {
          const closestTick = ticks.reduce((a, b) => Math.abs(b - newValue) < Math.abs(a - newValue) ? b : a)
          sliderValue.value = closestTick;
        } else {
          sliderValue.value = newValue;
        }
      }
      // console.log(`sliderValue.value === ${sliderValue.value}`)
      emit('update:modelValue', sliderValue.value)
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })

    }
    // console.log('Ending Playback')
}

const togglePlay = function() {
    isPlaying.value = !isPlaying.value
    // console.log(`isPlaying === ${isPlaying.value}`)
    if (isPlaying) playBack(isPlaying)
}

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
    <template v-slot:thumb-label="{ modelValue }">
      {{ formatThumbLabel(modelValue) }}
    </template>
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
