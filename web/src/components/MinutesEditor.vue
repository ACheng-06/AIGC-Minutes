<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ApiError } from '../api/http';
import { exportMinutes } from '../api/minutes';
import { saveRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import {
  MAX_DECISION_LENGTH,
  MAX_DECISIONS,
  MAX_OWNER_LENGTH,
  MAX_SUMMARY_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_TODO_TASK_LENGTH,
  MAX_TODOS,
} from '../constants';
import type { Minutes } from '../types/minutes';
import { copyText } from '../utils/clipboard';
import { buildExportFileName, downloadBlob } from '../utils/download';
import { formatMinutesText } from '../utils/formatMinutes';

const { state, markDirty, markSaved, setRecordId } = useMinutesStore();
const exporting = ref(false);
const liveMessage = ref('');

const statusText = computed(() => {
  if (state.dirty) {
    return '有未保存修改';
  }
  if (state.recordId) {
    return '已保存到本地';
  }
  return '已生成';
});

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
  if (state.minutes.decisions.length >= MAX_DECISIONS) {
    ElMessage.warning(`关键决策最多 ${MAX_DECISIONS} 条`);
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
  if (!state.minutes) {
    return;
  }
  if (state.minutes.todos.length >= MAX_TODOS) {
    ElMessage.warning(`待办事项最多 ${MAX_TODOS} 条`);
    return;
  }
  state.minutes.todos.push({ task: '', owner: '', dueDate: '' });
  markDirty();
}

async function removeTodo(index: number): Promise<void> {
  const todo = state.minutes?.todos[index];
  if (!todo) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定删除“${todo.task.trim() || '未命名待办'}”吗？`,
      '删除待办',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    );
  } catch {
    return;
  }

  state.minutes?.todos.splice(index, 1);
  markDirty();
  liveMessage.value = '已删除该条待办';
}

async function handleCopy(): Promise<void> {
  if (!state.minutes) {
    return;
  }

  try {
    await copyText(formatMinutesText(state.minutes));
    liveMessage.value = '已复制到剪贴板';
    ElMessage.success('已复制到剪贴板');
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制');
  }
}

const FIELD_LABELS: Array<[string, string]> = [
  ['minutes.title', '标题'],
  ['minutes.summary', '会议摘要'],
  ['minutes.decisions', '关键决策'],
  ['minutes.todos', '待办事项'],
];

/** 把后端 details 里的字段路径翻译成界面用语，避免只给一句“导出参数不合法”。 */
function describeExportError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return '导出失败，请稍后重试';
  }

  const details = error.details
    .slice(0, 3)
    .map((item) => {
      const label = FIELD_LABELS.find(
        ([path]) => item.path === path || item.path.startsWith(`${path}.`),
      )?.[1];
      return label ? `${label}：${item.message}` : item.message;
    })
    .join('；');

  return details ? `${error.message}（${details}）` : error.message;
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

  // 历史记录可能由旧版本写入，条数仍可能超出上限，导出前再拦一次。
  if (minutes.decisions.length > MAX_DECISIONS) {
    ElMessage.warning(`关键决策最多 ${MAX_DECISIONS} 条，请先删减`);
    return;
  }

  if (minutes.todos.length > MAX_TODOS) {
    ElMessage.warning(`待办事项最多 ${MAX_TODOS} 条，请先删减`);
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
    liveMessage.value = 'Word 文档已开始下载';
    ElMessage.success('Word 文档已开始下载');
  } catch (error) {
    ElMessage.error(describeExportError(error));
  } finally {
    exporting.value = false;
  }
}

/** 手动保存：已有本地记录时覆盖同一条，避免反复点击产生大量重复条目。 */
function handleSaveLocal(): void {
  if (!state.minutes) {
    return;
  }

  const saved = saveRecord(state.minutes, state.recordId);
  if (!saved.ok || !saved.record) {
    ElMessage.error(saved.error ?? '保存失败，请稍后重试');
    return;
  }

  setRecordId(saved.record.id);
  markSaved();
  liveMessage.value = '已保存到本地记录';

  if (saved.error) {
    ElMessage.warning(saved.error);
  } else {
    ElMessage.success('已保存到本地记录');
  }
}
</script>

<template>
  <section v-if="state.minutes" class="editor-sheet" :aria-busy="exporting">
    <header class="editor-header">
      <label class="sr-only" for="minutes-title">纪要标题</label>
      <el-input
        id="minutes-title"
        v-model="state.minutes.title"
        class="title-input"
        :maxlength="MAX_TITLE_LENGTH"
        placeholder="纪要标题"
      />
      <span class="status-tag" :class="{ 'is-dirty': state.dirty }">{{ statusText }}</span>
    </header>

    <p v-if="state.meta" class="editor-meta">
      {{ state.meta.sourceType === 'file' ? state.meta.fileName ?? '上传文件' : '粘贴文本' }} ·
      {{ state.meta.charCount.toLocaleString('zh-CN') }} 字符
      <span v-if="state.meta.cached" class="meta-cached">· 相同原文，复用上次结果</span>
    </p>
    <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>

    <section class="editor-section" aria-labelledby="summary-heading">
      <div class="section-heading">
        <h3 id="summary-heading">会议摘要</h3>
      </div>
      <label class="sr-only" for="minutes-summary">会议摘要</label>
      <el-input
        id="minutes-summary"
        v-model="state.minutes.summary"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 12 }"
        :maxlength="MAX_SUMMARY_LENGTH"
        show-word-limit
        placeholder="会议摘要"
      />
    </section>

    <section class="editor-section" aria-labelledby="decisions-heading">
      <div class="section-heading">
        <h3 id="decisions-heading">关键决策</h3>
        <el-button link type="primary" @click="addDecision">+ 添加决策</el-button>
      </div>

      <div v-if="state.minutes.decisions.length" class="decision-list">
        <div v-for="(decision, index) in state.minutes.decisions" :key="index" class="decision-row">
          <span class="decision-index" aria-hidden="true">{{ index + 1 }}.</span>
          <input
            v-model="state.minutes.decisions[index]"
            class="line-input"
            type="text"
            :aria-label="`第 ${index + 1} 条关键决策`"
            :maxlength="MAX_DECISION_LENGTH"
            placeholder="描述一条关键决策"
          />
          <el-button link type="danger" :aria-label="`删除第 ${index + 1} 条决策`" @click="removeDecision(index)">
            删除
          </el-button>
        </div>
      </div>
      <p v-else class="empty-state">还没有关键决策。点击“添加决策”记录一条。</p>
    </section>

    <section class="editor-section" aria-labelledby="todos-heading">
      <div class="section-heading">
        <h3 id="todos-heading">待办事项</h3>
        <el-button link type="primary" @click="addTodo">+ 添加待办</el-button>
      </div>

      <div v-if="state.minutes.todos.length" class="todo-table-wrap">
        <el-table class="todo-table" :data="state.minutes.todos" size="small">
          <el-table-column label="任务" min-width="260">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.task"
                :aria-label="`第 ${$index + 1} 条待办的任务`"
                :maxlength="MAX_TODO_TASK_LENGTH"
                placeholder="任务描述"
              />
            </template>
          </el-table-column>
          <el-table-column label="负责人" min-width="180">
            <template #default="{ row, $index }">
              <el-input
                v-model="row.owner"
                :aria-label="`第 ${$index + 1} 条待办的负责人`"
                :maxlength="MAX_OWNER_LENGTH"
                placeholder="未明确"
              />
            </template>
          </el-table-column>
          <el-table-column label="截止时间" min-width="170">
            <template #default="{ row, $index }">
              <el-date-picker
                v-model="row.dueDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="未明确"
                :aria-label="`第 ${$index + 1} 条待办的截止时间`"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="92">
            <template #default="{ $index }">
              <el-button
                link
                type="danger"
                class="row-delete"
                :aria-label="`删除第 ${$index + 1} 条待办`"
                @click="removeTodo($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <p v-else class="empty-state">还没有待办事项。点击“添加待办”创建一条。</p>
    </section>

    <div class="editor-actions">
      <div class="action-buttons">
        <el-button type="primary" plain @click="handleCopy">复制纪要</el-button>
        <el-button type="primary" :loading="exporting" @click="handleExport">导出 Word</el-button>
        <el-button :disabled="!state.dirty" @click="handleSaveLocal">保存到本地</el-button>
      </div>
      <p class="actions-tip">负责人和日期留空时，展示与复制时都会标记为“未明确”。</p>
    </div>
  </section>
</template>

<style scoped>
.editor-sheet {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.title-input {
  flex: 1;
  min-width: 0;
}

.title-input :deep(.el-input__wrapper) {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 1px 0 var(--color-primary);
}

.title-input :deep(.el-input__inner) {
  height: 44px;
  color: var(--color-fg);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
}

.status-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid var(--color-border);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  white-space: nowrap;
}

.status-tag.is-dirty {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.editor-meta {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.meta-cached {
  color: var(--color-primary);
}

.editor-section {
  padding-top: var(--space-4);
  margin-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.editor-section:first-of-type {
  margin-top: var(--space-4);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.section-heading h3 {
  font-size: var(--font-size-h3);
}

.decision-list {
  display: flex;
  flex-direction: column;
}

.decision-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
}

.decision-index {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
}

.line-input {
  width: 100%;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  background: transparent;
  color: var(--color-fg);
  font-size: var(--font-size-body);
}

.line-input::placeholder {
  color: var(--color-fg-muted);
}

.line-input:focus-visible {
  border-bottom-color: var(--color-primary);
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.empty-state {
  padding: var(--space-3) 0;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.todo-table-wrap {
  overflow-x: auto;
}

.todo-table {
  min-width: 720px;
}

.todo-table :deep(th.el-table__cell) {
  background: var(--color-surface-subtle);
  color: var(--color-fg-muted);
  font-weight: 600;
}

.todo-table :deep(td.el-table__cell) {
  border-bottom-color: var(--color-border);
}

.todo-table :deep(.el-input__wrapper) {
  padding: 2px 0;
  background: transparent;
  box-shadow: none;
}

.todo-table :deep(.el-input__wrapper:hover) {
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.todo-table :deep(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px var(--color-primary);
}

.todo-table :deep(.el-date-editor) {
  width: 100%;
}

.row-delete {
  min-width: 44px;
  min-height: 44px;
  padding-inline: 8px;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.action-buttons :deep(.el-button) {
  min-height: 44px;
}

.actions-tip {
  max-width: 38ch;
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

@media (max-width: 720px) {
  .editor-sheet {
    padding: var(--space-4);
  }

  .editor-header {
    flex-direction: column;
  }

  .title-input :deep(.el-input__inner) {
    font-size: 1.3rem;
  }

  .editor-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .action-buttons {
    width: 100%;
  }
}
</style>
