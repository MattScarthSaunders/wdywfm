<template>
  <DetailsSection title="Request Headers" :collapsed="false">
    <template #header-actions>
      <label class="checkbox-label-inline">
        <input 
          type="checkbox" 
          :checked="gradeHeaderImportance"
          @change="$emit('update:gradeHeaderImportance', ($event.target as HTMLInputElement).checked)"
        /> 
        Grade importance
      </label>
      <button 
        @click="viewMode = viewMode === 'json' ? 'formatted' : 'json'"
        class="toggle-view-btn"
      >
        {{ viewMode === 'json' ? 'Formatted' : 'JSON' }}
      </button>
      <button @click="copyRequestHeaders" class="copy-json-btn-header">Copy JSON</button>
    </template>
    <div 
      id="detailsRequestHeaders" 
      v-html="formattedRequestHeaders"
    ></div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NetworkRequest } from '../../types';
import { HeaderFormatter } from '../../services/HeaderFormatter';
import { ClipboardService } from '../../services/ClipboardService';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:gradeHeaderImportance': [value: boolean];
}>();

const viewMode = ref<'json' | 'formatted'>('formatted');

const formattedRequestHeaders = computed(() => {
  if (viewMode.value === 'json') {
    return HeaderFormatter.formatHeadersAsJSON(props.request.requestHeaders);
  } else {
    return HeaderFormatter.formatHeadersForDisplay(props.request.requestHeaders, props.gradeHeaderImportance);
  }
});

async function copyRequestHeaders() {
  await ClipboardService.copyHeaders(props.request.requestHeaders);
}
</script>

<style scoped>
.toggle-view-btn {
  padding: 2px 8px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-left: auto;
  margin-right: 6px;
}

.toggle-view-btn:hover {
  background: #e0e0e0;
}

.copy-json-btn-header {
  padding: 2px 8px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-left: auto;
}

.copy-json-btn-header:hover {
  background: #1565c0;
}

.copy-json-btn-header.copied {
  background: #4caf50;
}

.checkbox-label-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-left: auto;
  margin-right: 6px;
  white-space: nowrap;
}
</style>

