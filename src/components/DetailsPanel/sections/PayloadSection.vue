<template>
  <DetailsSection title="Payload Schema" :collapsed="true">
    <div id="detailsPayloadSchema">
      <template v-if="payloadSections.length === 0">
        <div class="no-payload">No payload data</div>
      </template>
      <template v-else>
        <div class="payload-content">
          <div class="subsection">
            <div 
              class="subsection-header" 
              :class="{ collapsed: isBodyCollapsed }"
            >
              <div class="subsection-header-left" @click="isBodyCollapsed = !isBodyCollapsed">
                <span class="subsection-toggle">▼</span>
                <span class="subsection-title">Payload Body</span>
              </div>
              <button 
                @click.stop="copyPayloadBody" 
                :class="['copy-btn', { copied: isBodyCopied }]"
                :title="isBodyCopied ? 'Copied!' : 'Copy Payload Body'"
              >
                <span class="material-icons">{{ isBodyCopied ? 'check' : 'content_copy' }}</span>
              </button>
            </div>
            <div 
              class="subsection-content"
              :class="{ collapsed: isBodyCollapsed }"
              :style="{ maxHeight: isBodyCollapsed ? '0' : '9999px' }"
            >
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
            </div>
          </div>
          <div v-if="isValidJson" class="subsection">
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
    </div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NetworkRequest } from '../../../types';
import { PayloadFormatter, type PayloadSection } from '../../../services/PayloadFormatter';
import { TypeScriptSchemaService } from '../../../services/TypeScriptSchemaService';
import { ClipboardService } from '../../../services/ClipboardService';
import DetailsSection from '../DetailsSection.vue';
import PayloadData from '../components/PayloadData.vue';
import PayloadJson from '../components/PayloadJson.vue';
import PayloadRaw from '../components/PayloadRaw.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const isBodyCopied = ref(false);
const isSchemaCopied = ref(false);
const isBodyCollapsed = ref(false);
const isSchemaCollapsed = ref(false);

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

const hasPayload = computed(() => {
  return !!props.request.postData;
});

const isValidJson = computed(() => {
  if (!hasPayload.value) {
    return false;
  }

  try {
    const contentType = (props.request.requestHeaders['content-type'] || 
                        props.request.requestHeaders['Content-Type'] || 
                        '').toString().toLowerCase();
    
    if (!contentType.includes('application/json') && 
        !contentType.includes('text/json') &&
        !contentType.includes('application/vnd.api+json')) {
      return false;
    }

    JSON.parse(props.request.postData!);
    return true;
  } catch (e) {
    return false;
  }
});

const formattedPayloadBody = computed(() => {
  if (!hasPayload.value) {
    return '';
  }

  if (isValidJson.value) {
    try {
      const jsonObj = JSON.parse(props.request.postData!);
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      return props.request.postData || '';
    }
  }

  return props.request.postData || '';
});

const schema = computed(() => {
  if (!hasPayload.value || !isValidJson.value) {
    return null;
  }

  try {
    const json = JSON.parse(props.request.postData!);
    const interfaceName = getInterfaceName(props.request.url);
    return TypeScriptSchemaService.generateSchema(json, interfaceName);
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
        .join('') + 'Payload';
    }
  } catch (e) {
    // Ignore
  }
  return 'Payload';
}

async function copyPayloadBody() {
  if (!hasPayload.value) {
    return;
  }

  const payloadToCopy = isValidJson.value ? formattedPayloadBody.value : props.request.postData!;
  await ClipboardService.copyToClipboard(payloadToCopy);
  isBodyCopied.value = true;
  setTimeout(() => {
    isBodyCopied.value = false;
  }, 2000);
}

async function copySchema() {
  if (!schema.value) {
    return;
  }

  await ClipboardService.copyToClipboard(schema.value);
  isSchemaCopied.value = true;
  setTimeout(() => {
    isSchemaCopied.value = false;
  }, 2000);
}
</script>

<style scoped>
.no-payload {
  color: var(--color-text-tertiary);
  font-size: 11px;
  padding: 8px;
  text-align: center;
}

.payload-content {
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

