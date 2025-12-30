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
import { deps } from 'vue-cocoon';
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';
import CookieItem from '../components/CookieItem.vue';

const props = defineProps<{
  request: NetworkRequest;
  allRequests: NetworkRequest[];
}>();

const { cookieFormatter } = deps();

const cookiesWithUsage = computed(() => {
  return cookieFormatter.getCookiesWithUsage(props.request.setCookies, props.request, props.allRequests);
});
</script>

