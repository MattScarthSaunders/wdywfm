<template>
  <DetailsSection title="Response Schema" :collapsed="true">
    <div id="detailsResponseSchema">
      <template v-if="loading">
        <div class="loading">Loading response body...</div>
      </template>
      <template v-else-if="hasResponseBody && isValidJson">
        <DetailsSection
          title="Response Body (JSON)"
          :collapsed="false"
        >
          <template #header-actions>
            <HeaderControls>
              <CopyButton
                :copied="isJsonCopied"
                :default-title="'Copy JSON'"
                @click="copyJson"
              />
            </HeaderControls>
          </template>

          <div class="sub-display">
            <JsonTree v-if="parsedJson" :value="parsedJson" />
          </div>
        </DetailsSection>

        <DetailsSection
          title="TypeScript Schema"
          :collapsed="false"
        >
          <template #header-actions>
            <HeaderControls>
              <CopyButton
                :copied="isSchemaCopied"
                :default-title="'Copy TypeScript Schema'"
                :disabled="!schema"
                @click="copySchema"
              />
            </HeaderControls>
          </template>

          <pre class="sub-display">{{ schema }}</pre>
        </DetailsSection>

        <DetailsSection
          title="Build Data Transform AI Prompt"
          :collapsed="true"
        >
          <div class="transform-tools">
            <div class="transform-tools-title">
              Paste target schema
            </div>
            <textarea
              class="transform-tools-target"
              v-model="targetSchemaInput"
              placeholder="export interface DesiredType {&#10;  // ...&#10;}"
            />
            <div class="transform-tools-notes-label">
              Optional schema notes:
            </div>
            <textarea
              v-model="notesInput"
              class="transform-tools-notes"
              placeholder="For example:&#10;- user_id in the response should map to id in the target.&#10;- timestamps are in seconds and should be converted to milliseconds."
            />
            <div class="transform-tools-actions">
              <button
                type="button"
                class="build-prompt-btn"
                :disabled="!canGeneratePrompt"
                @click="generateTransformPrompt"
              >
                <span class="material-icons">content_paste</span>
                <span>Build Prompt</span>
              </button>
              <HeaderControls v-if="transformPrompt">
                <CopyButton
                  :copied="isPromptCopied"
                  :default-title="'Copy AI Prompt'"
                  :disabled="!transformPrompt"
                  @click="copyPrompt"
                />
              </HeaderControls>
            </div>
            <pre
              v-if="transformPrompt"
              class="sub-display transform-prompt-display"
            >{{ transformPrompt }}</pre>
          </div>
        </DetailsSection>
      </template>
      <template v-else-if="hasResponseBody && !isValidJson">
        <DetailsSection
          title="Response Body (raw)"
          :collapsed="false"
        >
          <template #header-actions>
            <HeaderControls>
              <CopyButton
                :copied="isRawCopied"
                :default-title="'Copy Body'"
                @click="copyRaw"
              />
            </HeaderControls>
          </template>

          <pre class="sub-display">{{ props.request.responseBody }}</pre>
        </DetailsSection>
      </template>
      <template v-else>
        <div class="no-schema">No response body available or response is not a JSON response</div>
      </template>
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
import JsonTree from '../components/JsonTree.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const { typeScriptSchemaService, clipboardService, schemaTransformPromptService } = deps();
const isJsonCopied = ref(false);
const isSchemaCopied = ref(false);
const isPromptCopied = ref(false);
const isRawCopied = ref(false);
const loading = ref(false);
const targetSchemaInput = ref('');
const transformPrompt = ref('');
const notesInput = ref('');

const hasResponseBody = computed(() => {
  return !!props.request.responseBody;
});

const isValidJson = computed(() => {
  if (!hasResponseBody.value) {
    return false;
  }

  try {
    JSON.parse(props.request.responseBody!);
    return true;
  } catch (e) {
    return false;
  }
});

const formattedJson = computed(() => {
  if (!hasResponseBody.value || !isValidJson.value) {
    return '';
  }

  try {
    const jsonObj = JSON.parse(props.request.responseBody!);
    return JSON.stringify(jsonObj, null, 2);
  } catch (e) {
    return props.request.responseBody || '';
  }
});

const parsedJson = computed(() => {
  if (!hasResponseBody.value || !isValidJson.value) {
    return null;
  }

  try {
    return JSON.parse(props.request.responseBody!);
  } catch (e) {
    return null;
  }
});

const schema = computed(() => {
  if (!hasResponseBody.value || !isValidJson.value) {
    return null;
  }

  try {
    const interfaceName = getInterfaceName(props.request.url);
    return typeScriptSchemaService.generateSchemaFromResponseBody(props.request.responseBody!, interfaceName);
  } catch (e) {
    return null;
  }
});

const canGeneratePrompt = computed(() => {
  return !!schema.value && !!targetSchemaInput.value.trim();
});

function getInterfaceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('') + 'Response';
    }
  } catch (e) {
    // Ignore
  }
  return 'Response';
}


async function copyJson() {
  if (!formattedJson.value) {
    return;
  }

  await clipboardService.copyToClipboard(formattedJson.value);
  isJsonCopied.value = true;
  setTimeout(() => {
    isJsonCopied.value = false;
  }, 2000);
}

async function copySchema() {
  if (!schema.value) {
    return;
  }

  await clipboardService.copyToClipboard(schema.value);
  isSchemaCopied.value = true;
  setTimeout(() => {
    isSchemaCopied.value = false;
  }, 2000);
}

async function copyRaw() {
  if (!hasResponseBody.value) {
    return;
  }

  const body = props.request.responseBody || '';
  await clipboardService.copyToClipboard(body);
  isRawCopied.value = true;
  setTimeout(() => {
    isRawCopied.value = false;
  }, 2000);
}

function generateTransformPrompt() {
  if (!schema.value || !targetSchemaInput.value.trim()) {
    return;
  }

  transformPrompt.value = schemaTransformPromptService.buildTransformPrompt(
    schema.value,
    targetSchemaInput.value,
    notesInput.value
  );
}

async function copyPrompt() {
  if (!transformPrompt.value) {
    return;
  }

  await clipboardService.copyToClipboard(transformPrompt.value);
  isPromptCopied.value = true;
  setTimeout(() => {
    isPromptCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.loading,
.error,
.no-schema {
  color: var(--color-text-tertiary);
  font-size: 11px;
  padding: 8px;
  text-align: center;
}

.error {
  color: var(--color-error);
}

.sub-display {
  margin: 0;
  border-radius: 3px;
  padding: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 400px;
  color: var(--color-text-primary);
  background: var(--color-bg-light);
}

#detailsResponseSchema :deep(.details-data) {
  background: transparent;
  padding: 0;
}

.transform-tools {
  margin-top: 8px;
  padding: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border-subtle);
}

.transform-tools-title {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
}

.transform-tools textarea {
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  padding: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  border-radius: 3px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  resize: vertical;
  box-sizing: border-box;
}

.transform-tools-notes-label {
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.transform-tools-target {
  min-height: 60px;
}

.transform-tools-notes {
  margin-top: 2px;
  min-height: 60px;
}

.transform-tools-actions {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.transform-tools-actions .build-prompt-btn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 3px;
  border: none;
  background: var(--color-primary);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
}

.transform-tools-actions .build-prompt-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.build-prompt-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.build-prompt-btn .material-icons {
  line-height: 1; 
  font-size: 16px;
  display: inline-block;
}
</style>

