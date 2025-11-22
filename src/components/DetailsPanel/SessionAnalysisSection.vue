<template>
  <DetailsSection title="Session Analysis" :collapsed="true">
    <div id="detailsSession" v-html="formattedSession"></div>
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

const formattedSession = computed(() => {
  return DetailsFormatter.formatSession(props.request.session);
});
</script>

