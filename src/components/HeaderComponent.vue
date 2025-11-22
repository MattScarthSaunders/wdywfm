<template>
  <div class="header">
    <h1>Network Analysis</h1>
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
      <span>Sessions: {{ sessionRequests }}</span>
      <span>Bot Detection: {{ botDetectionCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  filterText: string;
  totalRequests: number;
  filteredRequests: number;
  sessionRequests: number;
  botDetectionCount: number;
}>();

defineEmits<{
  'update:filterText': [value: string];
  'clearFilter': [];
}>();
</script>

<style scoped>
.header {
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a1a;
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
  border-color: #0078d4;
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
}

.clear-btn {
  padding: 6px 10px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.stats-bar {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #666;
}

.stats-bar span {
  font-weight: 500;
}
</style>

