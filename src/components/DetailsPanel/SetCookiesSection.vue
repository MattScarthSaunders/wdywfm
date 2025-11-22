<template>
  <DetailsSection title="Set-Cookies" :collapsed="true">
    <div id="detailsCookies">
      <template v-if="cookiesWithUsage.length === 0">
        No set-cookies
      </template>
      <CookieItem
        v-for="(item, index) in cookiesWithUsage"
        :key="index"
        :cookie="item.cookie"
        :usage-info="item.usageInfo"
      />
    </div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../../types';
import { CookieFormatter } from '../../services/CookieFormatter';
import DetailsSection from './DetailsSection.vue';
import CookieItem from './CookieItem.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
}>();

const cookiesWithUsage = computed(() => {
  return CookieFormatter.getCookiesWithUsage(props.request.setCookies, props.request, props.allRequests);
});
</script>

