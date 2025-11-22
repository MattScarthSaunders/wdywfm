import { ref } from 'vue';

export function useSettings() {
  const preserveLog = ref(true);
  const gradeHeaderImportance = ref(false);
  const hideJavaScript = ref(false);
  const hideAssets = ref(false);

  function loadSettings() {
    chrome.storage.local.get(['preserveLog', 'gradeHeaderImportance', 'hideJavaScript', 'hideAssets'], (result) => {
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
    });
  }

  function saveSettings() {
    chrome.storage.local.set({
      preserveLog: preserveLog.value,
      gradeHeaderImportance: gradeHeaderImportance.value,
      hideJavaScript: hideJavaScript.value,
      hideAssets: hideAssets.value
    });
  }

  return {
    preserveLog,
    gradeHeaderImportance,
    hideJavaScript,
    hideAssets,
    loadSettings,
    saveSettings
  };
}

