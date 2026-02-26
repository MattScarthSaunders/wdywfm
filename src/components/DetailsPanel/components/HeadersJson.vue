<template>
  <div v-if="!hasHeaders" class="no-headers">
    No headers
  </div>
  <div v-else class="json-display">
    <JsonTree :value="props.headers" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import JsonTree from './JsonTree.vue';

const props = defineProps<{
  headers: Record<string, string | string[]>;
}>();

const hasHeaders = computed(() => {
  return props.headers && Object.keys(props.headers).length > 0;
});
</script>

<style scoped>
.no-headers {
  color: var(--color-text-tertiary);
}

.json-display {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  color: var(--color-text-primary);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 12px;
}
</style>

