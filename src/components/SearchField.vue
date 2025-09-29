<script setup>
import {defineProps, ref} from 'vue'

const props = defineProps({
    facet: String,
    facetData: Array,
    modelValue: Array,
});

const selectedValues = ref(props.modelValue) // suppress warning that props are read only, indirectly bind to selection v-model via this local var
const emit = defineEmits(["update:modelValue"])

// console.log('Facet data:')
// console.log(props.facetData)
</script>
<template>
    <v-autocomplete
        v-model="selectedValues"
        @update:modelValue="val => emit('update:modelValue', val)"
        clearable
        chips
        :label="`Durchsuche ${facet}...`"
        :items=facetData
        multiple>
    </v-autocomplete>
</template>