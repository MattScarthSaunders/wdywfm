<template>
  <DetailsSection title="Request Headers" :collapsed="true">
    <template #header-actions>
      <div class="header-controls">
        <button 
          @click.stop="$emit('update:gradeHeaderImportance', !gradeHeaderImportance)"
          :class="['grade-importance-btn', { active: gradeHeaderImportance }]"
          :title="gradeHeaderImportance ? 'Hide importance grading' : 'Show importance grading'"
        >
          <span class="material-icons">priority_high</span>
        </button>
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
          @click.stop="copyRequestHeaders" 
          :class="['copy-json-btn-header', { copied: isCopied }]"
          :title="isCopied ? 'Copied!' : 'Copy JSON'"
        >
          <span class="material-icons">{{ isCopied ? 'check' : 'content_copy' }}</span>
        </button>
      </div>
    </template>
    <HeadersList
      v-if="viewMode === 'formatted'"
      :headers="headers"
      :grade-importance="gradeHeaderImportance"
    />
    <HeadersJson
      v-else
      :headers="request.requestHeaders"
    />
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';
import HeadersList from '../components/HeadersList.vue';
import HeadersJson from '../components/HeadersJson.vue';

const props = defineProps<{
  request: NetworkRequest;
  gradeHeaderImportance: boolean;
}>();

defineEmits<{
  'update:gradeHeaderImportance': [value: boolean];
}>();

const { headerFormatter, clipboardService } = deps();
const viewMode = ref<'json' | 'formatted'>('formatted');
const isCopied = ref(false);

const headers = computed(() => {
  return headerFormatter.getHeaders(props.request.requestHeaders, props.gradeHeaderImportance);
});

async function copyRequestHeaders() {
  await clipboardService.copyHeaders(props.request.requestHeaders);
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

.grade-importance-btn {
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

.grade-importance-btn .material-icons {
  font-size: 16px;
}

.grade-importance-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.grade-importance-btn.active {
  background: var(--color-warning);
  color: white;
  border-color: var(--color-warning);
}

.grade-importance-btn.active:hover {
  background: var(--color-warning-dark);
}
</style>

