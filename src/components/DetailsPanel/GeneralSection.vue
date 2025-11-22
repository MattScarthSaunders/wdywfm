<template>
  <DetailsSection title="General" :collapsed="false">
    <div id="detailsGeneral">{{ generalInfo }}</div>
    <button @click="copyUrl" class="copy-json-btn-header" title="Copy URL to clipboard">Copy URL</button>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../../types';
import { DetailsFormatter } from '../../services/DetailsFormatter';
import { ClipboardService } from '../../services/ClipboardService';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const generalInfo = computed(() => {
  return DetailsFormatter.formatGeneralInfo(props.request);
});

async function copyUrl() {
  await ClipboardService.copyUrl(props.request.url);
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

