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
    <div id="detailsGeneral" class="general-info">
      <div><strong>URL:</strong> {{ generalInfo.url }}</div>
      <div><strong>Method:</strong> {{ generalInfo.method }}</div>
      <div><strong>Status:</strong> {{ generalInfo.status }}</div>
      <div><strong>Type:</strong> {{ generalInfo.type }}</div>
      <div><strong>Size:</strong> {{ generalInfo.size }}</div>
      <div><strong>Time:</strong> {{ generalInfo.time }}</div>
      <div><strong>Timestamp:</strong> {{ generalInfo.timestamp }}</div>
    </div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const { detailsFormatter, clipboardService } = deps();
const isCopied = ref(false);

const generalInfo = computed(() => {
  return detailsFormatter.getGeneralInfo(props.request);
});

async function copyUrl() {
  await clipboardService.copyUrl(props.request.url);
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
  background: var(--color-primary);
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
  background: var(--color-primary-hover);
}

.copy-json-btn-header.copied {
  background: var(--color-success);
}

.general-info {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.general-info div {
  margin-bottom: 4px;
}

.general-info strong {
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>

