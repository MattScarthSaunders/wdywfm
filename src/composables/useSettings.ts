import { ref } from 'vue';

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).filter((v): v is string => typeof v === 'string');
  }
  return [];
}

function asNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is number => typeof v === 'number');
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).filter((v): v is number => typeof v === 'number');
  }
  return [];
}

export function useSettings() {
  const preserveLog = ref(true);
  const gradeHeaderImportance = ref(false);
  const hideJavaScript = ref(false);
  const hideAssets = ref(false);
  const settingsLoaded = ref(false);
  const methodFilterEnabled = ref<string[]>([]);
  const typeFilterEnabled = ref<string[]>([]);
  const statusFilterValues = ref<number[]>([]);

  function loadSettings() {
    chrome.storage.local.get(
      [
        'preserveLog',
        'gradeHeaderImportance',
        'hideJavaScript',
        'hideAssets',
        'methodFilterEnabled',
        'typeFilterEnabled',
        'statusFilterValues'
      ],
      (result) => {
        if (result.preserveLog !== undefined) {
          preserveLog.value = result.preserveLog;
        }
        if (result.gradeHeaderImportance !== undefined) {
          gradeHeaderImportance.value = result.gradeHeaderImportance;
        }
        if (result.hideJavaScript !== undefined) {
          hideJavaScript.value = result.hideJavaScript;
        }
        if (result.hideAssets !== undefined) {
          hideAssets.value = result.hideAssets;
        }
        if (result.methodFilterEnabled !== undefined) {
          methodFilterEnabled.value = asStringArray(result.methodFilterEnabled);
        }
        if (result.typeFilterEnabled !== undefined) {
          typeFilterEnabled.value = asStringArray(result.typeFilterEnabled);
        }
        if (result.statusFilterValues !== undefined) {
          statusFilterValues.value = asNumberArray(result.statusFilterValues);
        }
        settingsLoaded.value = true;
      }
    );
  }

  function saveSettings() {
    chrome.storage.local.set({
      preserveLog: preserveLog.value,
      gradeHeaderImportance: gradeHeaderImportance.value,
      hideJavaScript: hideJavaScript.value,
      hideAssets: hideAssets.value,
      methodFilterEnabled: methodFilterEnabled.value,
      typeFilterEnabled: typeFilterEnabled.value,
      statusFilterValues: statusFilterValues.value
    });
  }

  return {
    preserveLog,
    gradeHeaderImportance,
    hideJavaScript,
    hideAssets,
    settingsLoaded,
    methodFilterEnabled,
    typeFilterEnabled,
    statusFilterValues,
    loadSettings,
    saveSettings
  };
}

