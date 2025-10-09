<script setup>
import PersonTraces from '../components/PersonTraces.vue'
import {defineProps, onMounted} from 'vue'
import { useRoute } from 'vue-router'

// const route = useRoute()
const props = defineProps({ persId: String });


</script>

<template>
    
<PersonTraces persId="{{props.persId}}"/>

</template>