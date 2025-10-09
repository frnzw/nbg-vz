<script setup>
import {RouterLink} from 'vue-router'
import {defineProps} from 'vue'
const props = defineProps({
    persons: {
      type: Array,
      required: true
    }
})

</script>

<template>
    <div class="popup-links-place">
      <RouterLink
        v-for="p in persons"
        :key="p.persId"
        :to="{ name: 'traces', params: { id: p.persId } }"
        class="link-class"
      >
        {{ p.persId }} ({{ p.choir }})
      </RouterLink>
    </div>
  </template>
  
  <style>
  .link-class {
    display: block; /* Zeilenumbruch automatisch */
    margin-bottom: 4px;
  }
  </style>
  