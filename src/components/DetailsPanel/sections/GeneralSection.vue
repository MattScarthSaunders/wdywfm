<template>
  <DetailsSection title="General" :collapsed="true">
    <template #header-actions>
      <HeaderControls>
        <CopyButton
          :copied="isCopied"
          :default-title="'Copy URL to clipboard'"
          @click="copyUrl"
        />
      </HeaderControls>
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
import HeaderControls from '../components/HeaderControls.vue';
import CopyButton from '../components/CopyButton.vue';

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

