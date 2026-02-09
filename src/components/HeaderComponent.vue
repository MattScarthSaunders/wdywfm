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

    <div class="capture-bar">
      <input
        type="text"
        class="capture-input"
        :value="searchValue"
        @input="$emit('update:searchValue', ($event.target as HTMLInputElement).value)"
        placeholder="Search response body for value"
        autocomplete="off"
      />
      <button
        class="capture-icon-btn"
        type="button"
        title="Search response bodies"
        @click="$emit('triggerSearch')"
      >
        <span class="material-icons">search</span>
      </button>
      <button
        class="capture-icon-btn"
        type="button"
        :class="{ active: captureModeEnabled }"
        title="Click an element on the page to capture value"
        @click="$emit('toggleCaptureMode')"
      >
        <span class="material-icons">ads_click</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  filterText: string;
  totalRequests: number;
  filteredRequests: number;
  searchValue: string;
  captureModeEnabled: boolean;
}>();

defineEmits<{
  'update:filterText': [value: string];
  'clearFilter': [];
  'update:searchValue': [value: string];
  'triggerSearch': [];
  'toggleCaptureMode': [];
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
  border: 1px solid var(--color-border-input);
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary-alt);
  box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.clear-btn {
  padding: 6px 10px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border-input);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-primary);
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

.capture-bar {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.capture-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--color-border-input);
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
}

.capture-input:focus {
  outline: none;
  border-color: var(--color-primary-alt);
  box-shadow: 0 0 0 2px var(--color-primary-shadow);
}

.capture-icon-btn {
  padding: 4px 10px;
  background: var(--color-bg-light);
  border: 1px solid var(--color-border-input);
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
}

.capture-icon-btn .material-icons {
  font-size: 16px;
}

.capture-icon-btn:hover {
  background: var(--color-bg-light);
  color: var(--color-text-primary);
}

.capture-icon-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.capture-value {
  color: var(--color-text-secondary);
}

.capture-value-empty {
  font-style: italic;
}

.ignore-punct-label {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
</style>

