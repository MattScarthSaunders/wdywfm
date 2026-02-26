<template>
  <div class="header">
    <h1>WDYWFM</h1>
    <div class="filter-container">
      <input 
        type="text" 
        v-model="filterInput"
        @keydown.enter.prevent="submitFilter"
        class="filter-input" 
        placeholder="Filter requests (e.g., status-code:200, method:GET, larger-than:1000)"
        autocomplete="off"
      />
      <button
        @click="submitFilter"
        class="apply-filter-btn"
        title="Apply filter"
        type="button"
      >
        +
      </button>
      <button @click="$emit('clearFilter')" class="clear-btn" title="Clear filter">✕</button>
    </div>
    <div v-if="filterTokens.length" class="filter-tokens">
      <button
        v-for="token in filterTokens"
        :key="token.id"
        type="button"
        class="filter-token"
        :class="{ 'filter-token-static': token.kind !== 'text' }"
      >
        <span class="filter-token-text">{{ token.label }}</span>
        <span
          class="filter-token-close"
          @click.stop="onRemoveToken(token)"
        >
          ✕
        </span>
      </button>
    </div>

    <div class="static-filters">
      <button
        type="button"
        class="static-toggle"
        @click="staticFiltersOpen = !staticFiltersOpen"
      >
        <span>Static Filters (allow/OR)</span>
        <span class="static-toggle-icon">
          {{ staticFiltersOpen ? '▾' : '▸' }}
        </span>
      </button>
      <div v-if="staticFiltersOpen" class="static-filters-panel">
        <div class="static-row">
          <span class="static-label">Method</span>
          <div class="static-controls">
            <button
              v-for="method in methodOptions"
              :key="method"
              type="button"
              class="static-pill"
              :class="{ active: methodFilterEnabled.includes(method) }"
              @click="emit('toggleMethodFilter', method)"
            >
              {{ method }}
            </button>
          </div>
        </div>

        <div class="static-row">
          <span class="static-label">Status</span>
          <div class="static-controls">
            <input
              type="number"
              min="0"
              class="status-input"
              v-model.number="statusInput"
              @keydown.enter.prevent="addStatusFromInput"
              placeholder="Any"
            />
            <button
              type="button"
              class="status-add-btn"
              @click="addStatusFromInput"
              title="Add status filter"
            >
              +
            </button>
          </div>
        </div>

        <div class="static-row">
          <span class="static-label">Type</span>
          <div class="static-controls">
            <button
              v-for="type in typeOptions"
              :key="type"
              type="button"
              class="static-pill"
              :class="{ active: typeFilterEnabled.includes(type) }"
              @click="emit('toggleTypeFilter', type)"
            >
              {{ formatTypeLabel(type) }}
            </button>
          </div>
        </div>
      </div>
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
import { ref, computed } from 'vue';

type FilterTokenKind = 'text' | 'method' | 'type' | 'status';

interface HeaderFilterToken {
  id: string;
  label: string;
  kind: FilterTokenKind;
  value: string | number;
  textIndex: number | null;
}

const props = defineProps<{
  filterTokens: HeaderFilterToken[];
  totalRequests: number;
  filteredRequests: number;
  searchValue: string;
  captureModeEnabled: boolean;
  methodFilterEnabled: string[];
  typeFilterEnabled: string[];
  statusFilters: number[];
}>();

const emit = defineEmits<{
  'clearFilter': [];
  'applyFilter': [value: string];
  'removeFilter': [token: HeaderFilterToken];
  'toggleMethodFilter': [method: string];
  'toggleTypeFilter': [type: string];
  'addStatusFilter': [value: number];
  'update:searchValue': [value: string];
  'triggerSearch': [];
  'toggleCaptureMode': [];
}>();

const filterInput = ref('');
const staticFiltersOpen = ref(false);

const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const typeOptions = ['document', 'xhr', 'script', 'stylesheet', 'image', 'font', 'media', 'other'];

const statusInput = ref<number | null>(null);

function submitFilter() {
  const value = filterInput.value.trim();
  if (!value) {
    return;
  }

  emit('applyFilter', value);
  filterInput.value = '';
}

function formatTypeLabel(type: string): string {
  if (!type) {
    return '';
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function addStatusFromInput() {
  const value = statusInput.value;
  if (value === null || Number.isNaN(value)) {
    return;
  }

  emit('addStatusFilter', value);
  statusInput.value = null;
}

function onRemoveToken(token: HeaderFilterToken) {
  emit('removeFilter', token);
}
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

.apply-filter-btn {
  padding: 6px 10px;
  background: var(--color-primary-alt);
  border: 1px solid var(--color-primary-alt);
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
  margin-top: 8px;
}

.stats-bar span {
  font-weight: 500;
}

.static-filters {
  margin-top: 8px;
  border: 1px solid var(--color-border-input);
  border-radius: 4px;
  background: var(--color-bg-lightest);
}

.static-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 6px;
  border-radius: 4px 4px 0 0;
  border: none;
  background: transparent;
  font-size: 11px;
  color: #f5c542;
  cursor: pointer;
}

.static-toggle-icon {
  font-size: 10px;
}

.static-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 6px 6px;
  border-top: 1px solid var(--color-border-input);
}

.static-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.static-label {
  width: 52px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.static-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.static-pill {
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border-input);
  background: var(--color-bg-hover);
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.static-pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.status-input {
  width: 80px;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--color-border-input);
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: var(--color-bg-white);
  color: var(--color-text-primary);
}

.status-add-btn {
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--color-border-input);
  background: var(--color-bg-hover);
  font-size: 11px;
  cursor: pointer;
  color: var(--color-text-primary);
}

.filter-tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.filter-token {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--color-border-input);
  background: var(--color-bg-light);
  font-size: 11px;
  color: var(--color-text-primary);
  cursor: default;
}

.filter-token-static {
  border-color: #f5c542;
}

.filter-token-text {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-token-close {
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
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

