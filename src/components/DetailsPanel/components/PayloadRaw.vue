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

