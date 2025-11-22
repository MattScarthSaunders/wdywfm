<template>
  <DetailsSection title="Set-Cookies" :collapsed="true">
    <div id="detailsCookies" v-html="formattedCookies"></div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../../types';
import { CookieFormatter } from '../../services/CookieFormatter';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
}>();

const formattedCookies = computed(() => {
  return CookieFormatter.formatCookies(props.request.setCookies, props.request, props.allRequests);
});
</script>

