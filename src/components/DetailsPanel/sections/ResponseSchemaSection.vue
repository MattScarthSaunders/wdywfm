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

          <pre class="sub-display">{{ formattedJson }}</pre>
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
import HeaderControls from '../components/HeaderControls.vue';
import CopyButton from '../components/CopyButton.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const { typeScriptSchemaService, clipboardService } = deps();
const isJsonCopied = ref(false);
const isSchemaCopied = ref(false);
const loading = ref(false);

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
</style>

