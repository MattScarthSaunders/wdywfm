<template>
  <DetailsSection title="Payload Schema" :collapsed="true">
    <div id="detailsPayloadSchema">
      <template v-if="payloadSections.length === 0">
        <div class="no-payload">No payload data</div>
      </template>
      <template v-else>
        <div class="payload-content">
          <DetailsSection
            title="Payload Body"
            :collapsed="false"
          >
            <template #header-actions>
              <HeaderControls>
                <CopyButton
                  :copied="isBodyCopied"
                  :default-title="'Copy Payload Body'"
                  @click="copyPayloadBody"
                />
              </HeaderControls>
            </template>

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
          </DetailsSection>

          <DetailsSection
            v-if="isValidJson"
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

            <pre class="schema-display">{{ schema }}</pre>
          </DetailsSection>
        </div>
      </template>
    </div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from '../../../types';
import type { PayloadSection } from '../../../services/PayloadFormatter';
import DetailsSection from '../DetailsSection.vue';
import CopyButton from '../components/CopyButton.vue';
import PayloadData from '../components/PayloadData.vue';
import PayloadJson from '../components/PayloadJson.vue';
import PayloadRaw from '../components/PayloadRaw.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const { payloadFormatter, typeScriptSchemaService, clipboardService, headerFormatter } = deps();
const isBodyCopied = ref(false);
const isSchemaCopied = ref(false);

const payloadSections = computed(() => {
  return payloadFormatter.getPayloadSections(props.request);
});

const dataSections = computed(() => {
  return payloadSections.value.filter((s: PayloadSection): s is PayloadSection & { type: 'data' } => s.type === 'data');
});

const jsonSections = computed(() => {
  return payloadSections.value.filter((s: PayloadSection): s is PayloadSection & { type: 'json' } => s.type === 'json');
});

const rawSections = computed(() => {
  return payloadSections.value.filter((s: PayloadSection): s is PayloadSection & { type: 'raw' } => s.type === 'raw');
});

const hasPayload = computed(() => {
  return !!props.request.postData;
});

const isValidJson = computed(() => {
  if (!hasPayload.value) {
    return false;
  }

  try {
    const contentType = (headerFormatter.getHeader(props.request.requestHeaders, 'content-type') || '').toLowerCase();
    
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
    return typeScriptSchemaService.generateSchema(json, interfaceName);
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
  await clipboardService.copyToClipboard(payloadToCopy);
  isBodyCopied.value = true;
  setTimeout(() => {
    isBodyCopied.value = false;
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

.payload-content :deep(.details-data) {
  background: transparent;
  padding: 0;
}

.schema-display {
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
</style>

