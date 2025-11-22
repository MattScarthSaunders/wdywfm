<template>
  <div class="header">
    <h1>WDYWFM</h1>
    <div class="filter-container">
      <input 
        type="text" 
        :value="filterText"
        @input="$emit('update:filterText', ($event.target as HTMLInputElement).value)"
        class="filter-input" 
        placeholder="Filter requests (e.g., status-code:200, method:GET, larger-than:1000)"
        autocomplete="off"
      />
      <button @click="$emit('clearFilter')" class="clear-btn" title="Clear filter">✕</button>
    </div>
    <div class="stats-bar">
      <span>Total: {{ totalRequests }}</span>
      <span>Filtered: {{ filteredRequests }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  filterText: string;
  totalRequests: number;
  filteredRequests: number;
}>();

defineEmits<{
  'update:filterText': [value: string];
  'clearFilter': [];
}>();
</script>

<style scoped>
.header {
  padding: 12px;
  background: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border-light);
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-dark);
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary-alt);
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

.clear-btn {
  padding: 6px 10px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border-input);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  background: var(--color-border);
}

.stats-bar {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stats-bar span {
  font-weight: 500;
}
</style>

