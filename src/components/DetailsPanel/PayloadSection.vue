<template>
  <DetailsSection title="Payload" :collapsed="false">
    <template #header-actions>
      <button @click="copyPayload" class="copy-json-btn-header">Copy JSON</button>
    </template>
    <div id="detailsPayload" v-html="formattedPayload"></div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../../types';
import { PayloadFormatter } from '../../services/PayloadFormatter';
import { ClipboardService } from '../../services/ClipboardService';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const formattedPayload = computed(() => {
  return PayloadFormatter.formatPayload(props.request);
});

async function copyPayload() {
  await ClipboardService.copyPayload(props.request.url, props.request.postData ?? undefined);
}
</script>

<style scoped>
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
</style>

