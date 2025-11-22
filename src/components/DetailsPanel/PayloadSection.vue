<template>
  <DetailsSection title="Payload" :collapsed="true">
    <template #header-actions>
      <div class="header-controls">
        <button 
          @click.stop="copyPayload" 
          :class="['copy-json-btn-header', { copied: isCopied }]"
          :title="isCopied ? 'Copied!' : 'Copy JSON'"
        >
          <span class="material-icons">{{ isCopied ? 'check' : 'content_copy' }}</span>
        </button>
      </div>
    </template>
    <div id="detailsPayload" v-html="formattedPayload"></div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NetworkRequest } from '../../types';
import { PayloadFormatter } from '../../services/PayloadFormatter';
import { ClipboardService } from '../../services/ClipboardService';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const isCopied = ref(false);

const formattedPayload = computed(() => {
  return PayloadFormatter.formatPayload(props.request);
});

async function copyPayload() {
  await ClipboardService.copyPayload(props.request.url, props.request.postData ?? undefined);
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
</style>

