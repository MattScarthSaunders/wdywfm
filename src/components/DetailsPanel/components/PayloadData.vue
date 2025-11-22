<template>
  <div class="payload-section">
    <div class="payload-table">
      <div 
        v-for="(item, index) in items" 
        :key="index" 
        class="payload-row"
      >
        <div class="payload-key">{{ item.key }}</div>
        <div class="payload-value">{{ item.value }}</div>
      </div>
      <div v-if="rawValue" class="payload-row">
        <div class="payload-value full-width">{{ rawValue }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  items: Array<{ key: string; value: string }>;
  rawValue?: string;
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

.payload-table {
  background: var(--color-bg-lighter);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.payload-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  border-bottom: 1px solid var(--color-border-lighter);
  padding: 6px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

.payload-row:last-child {
  border-bottom: none;
}

.payload-key {
  font-weight: 600;
  color: var(--color-primary);
  word-break: break-word;
  padding-right: 12px;
}

.payload-value {
  color: var(--color-text-primary);
  word-break: break-word;
}

.payload-value.full-width {
  grid-column: 1 / -1;
}
</style>

