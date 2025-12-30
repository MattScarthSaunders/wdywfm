<template>
  <DetailsSection title="Response Schema" :collapsed="true">
    <div id="detailsResponseSchema">
      <template v-if="loading">
        <div class="loading">Loading response body...</div>
      </template>
      <template v-else-if="hasResponseBody && isValidJson">
        <div class="response-content">
          <div class="subsection">
            <div 
              class="subsection-header" 
              :class="{ collapsed: isJsonCollapsed }"
            >
              <div class="subsection-header-left" @click="isJsonCollapsed = !isJsonCollapsed">
                <span class="subsection-toggle">▼</span>
                <span class="subsection-title">Response Body (JSON)</span>
              </div>
              <button 
                @click.stop="copyJson" 
                :class="['copy-btn', { copied: isJsonCopied }]"
                :title="isJsonCopied ? 'Copied!' : 'Copy JSON'"
              >
                <span class="material-icons">{{ isJsonCopied ? 'check' : 'content_copy' }}</span>
              </button>
            </div>
            <div 
              class="subsection-content"
              :class="{ collapsed: isJsonCollapsed }"
              :style="{ maxHeight: isJsonCollapsed ? '0' : '9999px' }"
            >
              <pre class="json-display">{{ formattedJson }}</pre>
            </div>
          </div>
          <div class="subsection">
            <div 
              class="subsection-header" 
              :class="{ collapsed: isSchemaCollapsed }"
            >
              <div class="subsection-header-left" @click="isSchemaCollapsed = !isSchemaCollapsed">
                <span class="subsection-toggle">▼</span>
                <span class="subsection-title">TypeScript Schema</span>
              </div>
              <button 
                @click.stop="copySchema" 
                :class="['copy-btn', { copied: isSchemaCopied }]"
                :title="isSchemaCopied ? 'Copied!' : 'Copy TypeScript Schema'"
                :disabled="!schema"
              >
                <span class="material-icons">{{ isSchemaCopied ? 'check' : 'content_copy' }}</span>
              </button>
            </div>
            <div 
              class="subsection-content"
              :class="{ collapsed: isSchemaCollapsed }"
              :style="{ maxHeight: isSchemaCollapsed ? '0' : '9999px' }"
            >
              <pre class="schema-display">{{ schema }}</pre>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="hasResponseBody && !isValidJson">
        <div class="error">Response body is not valid JSON</div>
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

const props = defineProps<{
  request: NetworkRequest;
}>();

const { typeScriptSchemaService, clipboardService } = deps();
const isJsonCopied = ref(false);
const isSchemaCopied = ref(false);
const loading = ref(false);
const isJsonCollapsed = ref(false);
const isSchemaCollapsed = ref(false);

const hasResponseBody = computed(() => {
  return !!props.request.responseBody;
});

const isValidJson = computed(() => {
  if (!hasResponseBody.value) {
    return false;
  }

  try {
    const contentType = (props.request.responseHeaders['content-type'] || 
                        props.request.responseHeaders['Content-Type'] || 
                        '').toString().toLowerCase();
    
    if (!contentType.includes('application/json') && 
        !contentType.includes('text/json') &&
        !contentType.includes('application/vnd.api+json')) {
      return false;
    }

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

.response-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subsection {
  display: flex;
  flex-direction: column;
}

.subsection-header {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  transition: color 0.2s;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subsection-header-left {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.subsection-header:hover .subsection-header-left {
  color: var(--color-text-primary);
}

.copy-btn {
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
  flex-shrink: 0;
}

.copy-btn:disabled {
  background: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.5;
}

.copy-btn .material-icons {
  font-size: 16px;
}

.copy-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.copy-btn.copied {
  background: var(--color-success);
}

.subsection-toggle {
  font-size: 10px;
  transition: transform 0.2s;
  display: inline-block;
}

.subsection-header.collapsed .subsection-toggle {
  transform: rotate(-90deg);
}

.subsection-content {
  transition: max-height 0.2s ease, opacity 0.15s ease, margin 0.2s ease, padding 0.2s ease;
  overflow: hidden;
}

.subsection-content.collapsed {
  max-height: 0 !important;
  opacity: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  transition: max-height 0.1s ease, opacity 0.1s ease, margin 0.1s ease, padding 0.1s ease;
}

.json-display,
.schema-display {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  color: var(--color-text-primary);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 12px;
}
</style>

