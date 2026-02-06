<template>
  <DetailsSection
    v-if="capturedValue && capturedPaths.length"
    title="Captured value & access paths"
    :collapsed="false"
  >
    <div class="capture-summary">
      <div class="capture-summary-value">
        <code>Value: {{ capturedValue }}</code>
      </div>

      <ul class="capture-summary-list">
        <li
          v-for="path in capturedPaths"
          :key="path"
          :class="{ 'capture-path-selected': selectedExample && selectedExample.path === path }"
          @click="selectCapturedPath(path)"
        >
          <code>{{ path }}</code>
        </li>
      </ul>

      <DetailsSection
        v-if="capturedExamples.length"
        title="Minimal example"
        :collapsed="false"
      >
        <template #header-actions>
          <HeaderControls>
            <CopyButton
              :copied="isExampleCopied"
              :default-title="'Copy JSON'"
              @click="copySelectedExample"
            />
          </HeaderControls>
        </template>

        <div v-if="selectedExample" class="capture-example-block">
          <div class="capture-example-note">
            All arrays truncated to first element for brevity.
          </div>
          <pre class="capture-example-json"><code>{{ selectedExample.example }}</code></pre>
        </div>
      </DetailsSection>
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
  capturedValue: string | null;
  capturedPaths: string[];
}>();

const { valueCaptureService, clipboardService } = deps();

const selectedPath = ref<string | null>(null);
const isExampleCopied = ref(false);

const capturedExamples = computed(() => {
  return valueCaptureService.buildExamples(
    props.request,
    props.capturedValue,
    props.capturedPaths
  );
});

const selectedExample = computed(() => {
  if (!capturedExamples.value.length) {
    return null;
  }
  const targetPath = selectedPath.value || capturedExamples.value[0].path;
  return capturedExamples.value.find((ex: { path: string; example: string }) => ex.path === targetPath) ?? capturedExamples.value[0];
});

function selectCapturedPath(path: string) {
  selectedPath.value = path;
}

async function copySelectedExample() {
  const ex = selectedExample.value;
  if (!ex) {
    return;
  }
  await clipboardService.copyToClipboard(ex.example);
  isExampleCopied.value = true;
  setTimeout(() => {
    isExampleCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.capture-summary {
  margin-bottom: 0;
}

.capture-summary-value {
  margin-bottom: 4px;
  font-size: 11px;
}

.capture-summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 11px;
  word-break: break-word;
}

.capture-summary-list li + li {
  margin-top: 2px;
}

.capture-summary-list li {
  padding: 2px 4px;
  cursor: pointer;
}

.capture-summary-list li:nth-child(odd) {
  background: var(--color-bg-lighter);
}

.capture-summary-list li:nth-child(even) {
  background: var(--color-bg-hover);
  border-top: 1px solid var(--color-border-lighter);
  border-bottom: 1px solid var(--color-border-lighter);
}

.capture-summary-list li.capture-path-selected code {
  color: var(--color-primary);
}

.capture-example-block {
  margin-top: 8px;
}

.capture-example-note {
  font-size: 11px;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
}

.capture-example-json {
  margin: 0;
  background: var(--color-bg-light);
  border-radius: 3px;
  padding: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow: auto;
}
</style>

