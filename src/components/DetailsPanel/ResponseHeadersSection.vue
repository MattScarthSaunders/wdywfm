<template>
  <DetailsSection title="Response Headers" :collapsed="true">
    <template #header-actions>
      <div class="header-controls">
        <div class="view-mode-buttons">
          <button 
            @click.stop="viewMode = 'formatted'"
            :class="['view-mode-btn', { active: viewMode === 'formatted' }]"
            title="Formatted view"
          >
            <span class="material-icons">description</span>
          </button>
          <button 
            @click.stop="viewMode = 'json'"
            :class="['view-mode-btn', { active: viewMode === 'json' }]"
            title="JSON view"
          >
            <span class="material-icons">code</span>
          </button>
        </div>
        <button 
          @click.stop="copyResponseHeaders" 
          :class="['copy-json-btn-header', { copied: isCopied }]"
          :title="isCopied ? 'Copied!' : 'Copy JSON'"
        >
          <span class="material-icons">{{ isCopied ? 'check' : 'content_copy' }}</span>
        </button>
      </div>
    </template>
    <div id="detailsResponseHeaders" v-html="formattedResponseHeaders"></div>
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

const viewMode = ref<'json' | 'formatted'>('formatted');
const isCopied = ref(false);

const formattedResponseHeaders = computed(() => {
  if (viewMode.value === 'json') {
    return HeaderFormatter.formatHeadersAsJSON(props.request.responseHeaders);
  } else {
    return HeaderFormatter.formatHeadersForDisplay(props.request.responseHeaders, props.gradeHeaderImportance);
  }
});

async function copyResponseHeaders() {
  await ClipboardService.copyHeaders(props.request.responseHeaders);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.header-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.view-mode-buttons {
  display: flex;
  gap: 2px;
}

.view-mode-btn {
  padding: 4px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.view-mode-btn .material-icons {
  font-size: 16px;
}

.view-mode-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.view-mode-btn.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.view-mode-btn.active:hover {
  background: #1565c0;
}

.copy-json-btn-header {
  padding: 4px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.copy-json-btn-header .material-icons {
  font-size: 16px;
}

.copy-json-btn-header:hover {
  background: #1565c0;
}

.copy-json-btn-header.copied {
  background: #4caf50;
}
</style>

