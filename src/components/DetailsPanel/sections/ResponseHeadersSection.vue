<template>
  <DetailsSection title="Response Headers" :collapsed="true">
    <template #header-actions>
      <HeaderControls>
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
        <CopyButton
          :copied="isCopied"
          :default-title="'Copy JSON'"
          @click="copyResponseHeaders"
        />
      </HeaderControls>
    </template>
    <HeadersList
      v-if="viewMode === 'formatted'"
      :headers="headers"
      :grade-importance="false"
    />
    <HeadersJson
      v-else
      :headers="request.responseHeaders"
    />
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';
import HeaderControls from '../components/HeaderControls.vue';
import CopyButton from '../components/CopyButton.vue';
import HeadersList from '../components/HeadersList.vue';
import HeadersJson from '../components/HeadersJson.vue';

const props = defineProps<{
  request: NetworkRequest;
  gradeHeaderImportance: boolean;
}>();

const { headerFormatter, clipboardService } = deps();
const viewMode = ref<'json' | 'formatted'>('formatted');
const isCopied = ref(false);

const headers = computed(() => {
  return headerFormatter.getHeaders(props.request.responseHeaders, false);
});

async function copyResponseHeaders() {
  await clipboardService.copyHeaders(props.request.responseHeaders);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.view-mode-buttons {
  display: flex;
  gap: 2px;
}

.view-mode-btn {
  padding: 4px;
  background: var(--color-bg-light);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-input);
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
  background: var(--color-border);
  color: var(--color-text-primary);
}

.view-mode-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.view-mode-btn.active:hover {
  background: var(--color-primary-hover);
}
</style>

