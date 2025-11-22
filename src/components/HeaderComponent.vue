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

