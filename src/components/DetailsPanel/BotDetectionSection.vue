<template>
  <DetailsSection title="Bot Detection Analysis" :collapsed="true">
    <div id="detailsBotDetection" v-html="formattedBotDetection"></div>
  </DetailsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NetworkRequest } from '../../types';
import { DetailsFormatter } from '../../services/DetailsFormatter';
import DetailsSection from './DetailsSection.vue';

const props = defineProps<{
  request: NetworkRequest;
}>();

const formattedBotDetection = computed(() => {
  return DetailsFormatter.formatBotDetection(props.request.botDetection);
});
</script>

