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
    <div id="detailsPayload">
      <template v-if="payloadSections.length === 0">
        <div class="no-payload">No payload data</div>
      </template>
      <template v-else>
        <PayloadData
          v-for="(section, index) in dataSections"
          :key="`data-${index}`"
          :title="section.title"
          :items="section.items"
          :raw-value="section.rawValue"
        />
        <PayloadJson
          v-for="(section, index) in jsonSections"
          :key="`json-${index}`"
          :title="section.title"
          :data="section.data"
        />
        <PayloadRaw
          v-for="(section, index) in rawSections"
          :key="`raw-${index}`"
          :title="section.title"
          :data="section.data"
        />
      </template>
    </div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NetworkRequest } from '../../../types';
import { PayloadFormatter, type PayloadSection } from '../../../services/PayloadFormatter';
import { ClipboardService } from '../../../services/ClipboardService';
import DetailsSection from '../DetailsSection.vue';
import PayloadData from '../components/PayloadData.vue';
import PayloadJson from '../components/PayloadJson.vue';
import PayloadRaw from '../components/PayloadRaw.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const isCopied = ref(false);

const payloadSections = computed(() => {
  return PayloadFormatter.getPayloadSections(props.request);
});

const dataSections = computed(() => {
  return payloadSections.value.filter((s): s is PayloadSection & { type: 'data' } => s.type === 'data');
});

const jsonSections = computed(() => {
  return payloadSections.value.filter((s): s is PayloadSection & { type: 'json' } => s.type === 'json');
});

const rawSections = computed(() => {
  return payloadSections.value.filter((s): s is PayloadSection & { type: 'raw' } => s.type === 'raw');
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

.no-payload {
  color: var(--color-text-tertiary);
}
</style>

