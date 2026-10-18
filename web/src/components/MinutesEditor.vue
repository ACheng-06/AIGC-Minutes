<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { ApiError } from '../api/http';
import { exportMinutes } from '../api/minutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import type { Minutes } from '../types/minutes';
import { copyText } from '../utils/clipboard';
import { buildExportFileName, downloadBlob } from '../utils/download';
import { formatMinutesText } from '../utils/formatMinutes';

const { state, markDirty } = useMinutesStore();
const exporting = ref(false);

// flush: 'sync' 保证编辑后立即标记“未保存”，不依赖下一次渲染。
watch(
  () => state.minutes,
  () => {
    if (state.minutes) {
      markDirty();
    }
  },
  { deep: true, flush: 'sync' },
);

function addDecision(): void {
  if (!state.minutes) {
    return;
  }
  state.minutes.decisions.push('');
  markDirty();
}

function removeDecision(index: number): void {
  state.minutes?.decisions.splice(index, 1);
  markDirty();
}

function addTodo(): void {
  state.minutes?.todos.push({ task: '', owner: '', dueDate: '' });
  markDirty();
}

function removeTodo(index: number): void {
  state.minutes?.todos.splice(index, 1);
  markDirty();
}

async function handleCopy(): Promise<void> {
  if (!state.minutes) {
    return;
  }

  try {
    await copyText(formatMinutesText(state.minutes));
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制');
  }
}

/** 导出前先在前端做一次轻量校验，避免把明显不合法的内容发给后端。 */
async function handleExport(): Promise<void> {
  const minutes = state.minutes;
  if (!minutes) {
    return;
  }

  if (!minutes.summary.trim()) {
    ElMessage.warning('请先填写会议摘要');
    return;
  }

  const emptyTaskIndex = minutes.todos.findIndex((todo) => !todo.task.trim());
  if (emptyTaskIndex >= 0) {
    ElMessage.warning(`第 ${emptyTaskIndex + 1} 条待办缺少任务描述`);
    return;
  }

  const payload: Minutes = {
    title: minutes.title.trim() || '会议纪要',
    summary: minutes.summary.trim(),
    decisions: minutes.decisions.map((decision) => decision.trim()).filter(Boolean),
    todos: minutes.todos.map((todo) => ({
      task: todo.task.trim(),
      owner: todo.owner.trim(),
      dueDate: todo.dueDate || '',
    })),
  };

  exporting.value = true;
  try {
    const blob = await exportMinutes(payload);
    downloadBlob(blob, buildExportFileName(payload.title));
    ElMessage.success('Word 文档已开始下载');
  } catch (error) {
    ElMessage.error(error instanceof ApiError ? error.message : '导出失败，请稍后重试');
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <el-card v-if="state.minutes" shadow="never" class="editor-card">
    <template #header>
      <div class="editor-header">
        <el-input
          v-model="state.minutes.title"
          class="title-input"
          maxlength="100"
          placeholder="纪要标题"
        />
        <el-tag v-if="state.dirty" type="warning" size="small">有未保存修改</el-tag>
        <el-tag v-else type="success" size="small">已生成</el-tag>
      </div>
    </template>

    <h3>会议摘要</h3>
    <el-input
      v-model="state.minutes.summary"
      type="textarea"
      :autosize="{ minRows: 4, maxRows: 12 }"
      maxlength="20000"
      show-word-limit
      placeholder="会议摘要"
    />

    <div class="section-heading">
      <h3>关键决策</h3>
      <el-button link type="primary" @click="addDecision">+ 添加决策</el-button>
    </div>
    <div v-if="state.minutes.decisions.length" class="decision-list">
      <div v-for="(decision, index) in state.minutes.decisions" :key="index" class="decision-row">
        <span class="decision-index">{{ index + 1 }}.</span>
        <el-input v-model="state.minutes.decisions[index]" placeholder="描述一条关键决策" />
        <el-button link type="danger" @click="removeDecision(index)">删除</el-button>
      </div>
    </div>
    <p v-else class="empty-text">暂无关键决策。</p>

    <div class="section-heading">
      <h3>待办事项</h3>
      <el-button link type="primary" @click="addTodo">+ 添加待办</el-button>
    </div>
    <el-table v-if="state.minutes.todos.length" :data="state.minutes.todos" size="small">
      <el-table-column label="任务" min-width="200">
        <template #default="{ row }">
          <el-input v-model="row.task" placeholder="任务描述" />
        </template>
      </el-table-column>
      <el-table-column label="负责人" width="150">
        <template #default="{ row }">
          <el-input v-model="row.owner" placeholder="未明确" />
        </template>
      </el-table-column>
      <el-table-column label="截止时间" width="170">
        <template #default="{ row }">
          <el-date-picker
            v-model="row.dueDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="未明确"
            style="width: 100%"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ $index }">
          <el-button link type="danger" @click="removeTodo($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <p v-else class="empty-text">暂无待办事项。</p>

    <div class="editor-actions">
      <el-button type="primary" plain @click="handleCopy">复制纪要</el-button>
      <el-button type="primary" :loading="exporting" @click="handleExport">导出 Word</el-button>
      <span class="actions-tip">负责人和日期留空时，展示与复制时都会标记为“未明确”</span>
    </div>
  </el-card>
</template>

<style scoped>
.editor-card {
  border-radius: 12px;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-input {
  max-width: 420px;
}

.title-input :deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 600;
}

h3 {
  margin: 20px 0 8px;
  font-size: 15px;
}

h3:first-of-type {
  margin-top: 0;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-heading h3 {
  margin-bottom: 8px;
}

.decision-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.decision-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.decision-index {
  width: 24px;
  color: #909399;
  font-size: 13px;
}

.empty-text {
  margin: 0;
  color: #a8abb2;
  font-size: 13px;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.actions-tip {
  color: #a8abb2;
  font-size: 12px;
}
</style>
