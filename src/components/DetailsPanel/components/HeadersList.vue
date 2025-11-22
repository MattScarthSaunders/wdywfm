<template>
  <div v-if="headers.length === 0" class="no-headers">
    No headers
  </div>
  <template v-else>
    <HeaderItem
      v-for="(header, index) in headers"
      :key="index"
      :header="header"
      :grade-importance="gradeImportance"
    />
  </template>
</template>

<script setup lang="ts">
import HeaderItem from './HeaderItem.vue';

interface Header {
  name: string;
  value: string;
  importance?: string;
}

defineProps<{
  headers: Header[];
  gradeImportance: boolean;
}>();
</script>

<style scoped>
.no-headers {
  color: var(--color-text-tertiary);
}
</style>

