<template>
  <DetailsSection title="General" :collapsed="true">
    <template #header-actions>
      <div class="header-controls">
        <button 
          @click.stop="copyUrl" 
          :class="['copy-json-btn-header', { copied: isCopied }]"
          :title="isCopied ? 'Copied!' : 'Copy URL to clipboard'"
        >
          <span class="material-icons">{{ isCopied ? 'check' : 'content_copy' }}</span>
        </button>
      </div>
    </template>
    <div id="detailsGeneral">{{ generalInfo }}</div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NetworkRequest } from '../../types';
import { DetailsFormatter } from '../../services/DetailsFormatter';
import { ClipboardService } from '../../services/ClipboardService';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const isCopied = ref(false);

const generalInfo = computed(() => {
  return DetailsFormatter.formatGeneralInfo(props.request);
});

async function copyUrl() {
  await ClipboardService.copyUrl(props.request.url);
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

