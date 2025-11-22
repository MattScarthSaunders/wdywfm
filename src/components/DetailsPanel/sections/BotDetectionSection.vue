<template>
  <DetailsSection title="Bot Detection Analysis" :collapsed="true">
    <BotDetection :bot-detection="request.botDetection" />
  </DetailsSection>
</template>

<script setup lang="ts">
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';
import BotDetection from '../components/BotDetection.vue';

defineProps<{
  request: NetworkRequest;
}>();
</script>

