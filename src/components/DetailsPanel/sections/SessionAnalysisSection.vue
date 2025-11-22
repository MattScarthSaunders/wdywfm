<template>
  <DetailsSection title="Session Analysis" :collapsed="true">
    <SessionAnalysis :session="request.session" />
  </DetailsSection>
</template>

<script setup lang="ts">
import type { NetworkRequest } from '../../../types';
import DetailsSection from '../DetailsSection.vue';
import SessionAnalysis from '../components/SessionAnalysis.vue';

defineProps<{
  request: NetworkRequest;
}>();
</script>

