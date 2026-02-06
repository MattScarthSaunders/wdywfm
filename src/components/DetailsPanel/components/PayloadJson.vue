<template>
  <div class="payload-section">
      <pre class="json-display">{{ formattedJson }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  data: string;
}>();

const formattedJson = computed(() => {
  try {
    const jsonObj = JSON.parse(props.data);
    return JSON.stringify(jsonObj, null, 2);
  } catch (e) {
    return props.data;
  }
});
</script>

<style scoped>
.payload-section {
  margin-bottom: 16px;
}

.payload-section:last-child {
  margin-bottom: 0;
}

.payload-section-title {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 11px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}


.json-display {
  margin: 0;
  border-radius: 3px;
  padding: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 400px;
  color: var(--color-text-primary);
  background: var(--color-bg-light);
}
</style>

