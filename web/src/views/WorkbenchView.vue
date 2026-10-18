<script setup lang="ts">
import InputPanel from '../components/InputPanel.vue';
import MinutesEditor from '../components/MinutesEditor.vue';
import { ApiError } from '../api/http';
import { generateByFile, generateByText } from '../api/minutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import type { GenerateInput } from '../types/minutes';

const { state, setResult, setLoading, setError } = useMinutesStore();

async function handleGenerate(input: GenerateInput): Promise<void> {
  setLoading(true);
  setError('');

  try {
    const result = input.type === 'text' ? await generateByText(input.text) : await generateByFile(input.file);
    setResult(result);
  } catch (error) {
    setError(error instanceof ApiError ? error.message : '生成失败，请稍后重试');
  } finally {
    setLoading(false);
  }
}
</script>

<template>
  <div class="workbench">
    <InputPanel :loading="state.loading" @generate="handleGenerate" />

    <el-alert
      v-if="state.error"
      class="result-error"
      type="error"
      :closable="false"
      show-icon
      :title="state.error"
    />

    <el-skeleton v-if="state.loading" class="result-skeleton" :rows="6" animated />

    <MinutesEditor v-else-if="state.minutes" />
  </div>
</template>

<style scoped>
.workbench {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-error {
  margin-top: 4px;
}

.result-skeleton {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
}
</style>
