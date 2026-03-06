<template>
  <div class="payload-section">
      <pre class="json-display">{{ data }}</pre>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  data: string;
}>();
</script>

<style scoped>
.payload-section {
  margin-bottom: 16px;
}

.payload-section:last-child {
  margin-bottom: 0;
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
}
</style>

