<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

onMounted(() => {
  document.body.setAttribute('data-theme', 'silk')
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
