<script setup lang="ts">
import InputPanel from '../components/InputPanel.vue';
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

    <el-card v-else-if="state.minutes" shadow="never" class="result-card">
      <template #header>
        <div class="result-header">
          <span class="result-title">{{ state.minutes.title }}</span>
          <el-tag type="success" size="small">生成成功</el-tag>
        </div>
      </template>

      <h3>会议摘要</h3>
      <p class="summary-text">{{ state.minutes.summary }}</p>

      <h3>关键决策</h3>
      <ol v-if="state.minutes.decisions.length" class="decision-list">
        <li v-for="(decision, index) in state.minutes.decisions" :key="index">{{ decision }}</li>
      </ol>
      <p v-else class="empty-text">本次会议未记录明确决策。</p>

      <h3>待办事项</h3>
      <el-table v-if="state.minutes.todos.length" :data="state.minutes.todos" size="small">
        <el-table-column prop="task" label="任务" min-width="200" />
        <el-table-column label="负责人" width="130">
          <template #default="{ row }">{{ row.owner || '未明确' }}</template>
        </el-table-column>
        <el-table-column label="截止时间" width="130">
          <template #default="{ row }">{{ row.dueDate || '未明确' }}</template>
        </el-table-column>
      </el-table>
      <p v-else class="empty-text">本次会议未记录明确待办。</p>

      <p v-if="state.meta" class="meta-text">
        来源：{{ state.meta.fileName || '粘贴文本' }} · 原文 {{ state.meta.charCount }} 字符
      </p>
    </el-card>
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

.result-card {
  border-radius: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
}

h3 {
  margin: 20px 0 8px;
  font-size: 15px;
  color: #303133;
}

h3:first-of-type {
  margin-top: 0;
}

.summary-text {
  margin: 0;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.decision-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 1.8;
}

.empty-text {
  margin: 0;
  color: #a8abb2;
  font-size: 13px;
}

.meta-text {
  margin: 16px 0 0;
  color: #a8abb2;
  font-size: 12px;
}

.result-skeleton {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
}
</style>
