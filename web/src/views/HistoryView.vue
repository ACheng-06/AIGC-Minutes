<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clearRecords, listRecords, removeRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import { LOCAL_HISTORY_LIMIT } from '../constants';
import type { LocalMinutesRecord, Minutes } from '../types/minutes';

const router = useRouter();
const { state, setLoadedRecord } = useMinutesStore();
const records = ref<LocalMinutesRecord[]>([]);
const limit = LOCAL_HISTORY_LIMIT;

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const dateOnlyFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeOnlyFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function reload(): void {
  records.value = listRecords();
}

onMounted(reload);

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDay(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateOnlyFormatter.format(date).replace(/\//g, '.');
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : timeOnlyFormatter.format(date);
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function excerpt(minutes: Minutes): string {
  const text = minutes.summary.replace(/\s+/g, ' ').trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

async function handleLoad(record: LocalMinutesRecord): Promise<void> {
  if (state.minutes && state.dirty) {
    try {
      await ElMessageBox.confirm('当前未保存修改会被替换。', '载入本地记录', {
        type: 'warning',
        confirmButtonText: '继续载入',
        cancelButtonText: '取消',
      });
    } catch {
      return;
    }
  }

  setLoadedRecord(record);
  ElMessage.success('已载入工作台');
  void router.push('/workspace');
}

async function handleRemove(record: LocalMinutesRecord): Promise<void> {
  try {
    await ElMessageBox.confirm('删除后无法恢复，确定删除这条记录吗？', '删除本地记录', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }

  removeRecord(record.id);
  reload();
  ElMessage.success('已删除该条记录');
}

async function handleClear(): Promise<void> {
  try {
    await ElMessageBox.confirm('清空后无法恢复，确定删除全部本地记录吗？', '清空本地记录', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }

  clearRecords();
  reload();
  ElMessage.success('已清空本地记录');
}
</script>

<template>
  <div class="history-page">
    <div class="history-inner">
      <header class="history-head">
        <div class="history-heading">
          <p class="eyebrow">LIBRARY · 本地</p>
          <h1>本地记录</h1>
          <p class="history-intro">
            只保存在当前浏览器，最多 {{ limit }} 条。生成纪要后会自动保存在这里。
          </p>
        </div>

        <div class="history-actions" aria-label="记录操作">
          <span class="history-count">{{ records.length }} / {{ limit }}</span>
          <el-button
            text
            class="clear-button"
            :disabled="records.length === 0"
            @click="handleClear"
          >
            清空全部
          </el-button>
          <router-link class="button button-secondary" to="/workspace">新建纪要</router-link>
        </div>
      </header>

      <section v-if="records.length" class="archive-panel" aria-label="本地记录列表">
        <ul class="archive-list">
          <li v-for="(record, index) in records" :key="record.id" class="archive-item">
            <article class="archive-row">
              <time
                class="archive-date"
                :datetime="record.savedAt"
                :title="formatSavedAt(record.savedAt)"
              >
                <span class="archive-day">{{ formatDay(record.savedAt) }}</span>
                <span class="archive-clock">{{ formatTime(record.savedAt) }}</span>
              </time>

              <div class="archive-main">
                <div class="archive-title-line">
                  <span class="archive-index" aria-hidden="true">{{ padIndex(index) }}</span>
                  <h2>{{ record.minutes.title }}</h2>
                </div>
                <p class="archive-excerpt">{{ excerpt(record.minutes) }}</p>
                <p class="archive-meta">
                  <span>{{ record.minutes.todos.length }} 条待办</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ record.minutes.decisions.length }} 条决策</span>
                </p>
              </div>

              <div class="archive-actions">
                <el-button
                  class="load-button"
                  :aria-label="`载入${record.minutes.title}`"
                  @click="handleLoad(record)"
                >
                  载入
                </el-button>
                <el-button
                  text
                  type="danger"
                  class="delete-button"
                  :aria-label="`删除${record.minutes.title}`"
                  @click="handleRemove(record)"
                >
                  删除
                </el-button>
              </div>
            </article>
          </li>
        </ul>
      </section>

      <div v-else class="archive-empty">
        <span class="empty-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <h2>还没有本地记录</h2>
        <p>生成纪要后会自动保存在当前浏览器，最多保留 {{ limit }} 条。</p>
        <router-link class="button button-primary" to="/workspace">去工作台</router-link>
      </div>

      <p class="privacy-tip">本地记录保存在当前浏览器中，不会上传服务器；共用电脑时请及时清空。</p>
    </div>
  </div>
</template>

<style scoped>
.history-page {
  padding-block: var(--space-6) var(--space-9);
}

.history-inner {
  width: 100%;
  max-width: var(--content-history);
  margin: 0 auto;
  padding-inline: var(--content-pad);
}

.history-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.eyebrow {
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.history-heading h1 {
  margin-top: var(--space-2);
  font-size: var(--font-size-h1);
}

.history-intro {
  max-width: 58ch;
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.history-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-2);
}

.history-count {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.history-actions :deep(.el-button) {
  min-height: 44px;
}

.clear-button {
  color: var(--color-fg-muted);
}

.archive-panel {
  margin-top: var(--space-5);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.archive-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.archive-item + .archive-item {
  border-top: 1px solid var(--color-border);
}

.archive-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  transition: background-color var(--duration-fast) var(--ease-out);
}

.archive-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}

.archive-day {
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.archive-clock {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.archive-main {
  min-width: 0;
}

.archive-title-line {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.archive-index {
  color: var(--color-border-strong);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.archive-main h2 {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-h3);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archive-excerpt {
  display: -webkit-box;
  max-width: 72ch;
  margin-top: var(--space-2);
  overflow: hidden;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.archive-meta {
  display: flex;
  gap: 6px;
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
}

.archive-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
}

.archive-actions :deep(.el-button) {
  min-height: 44px;
  border-radius: var(--radius-sm);
}

.load-button {
  padding-inline: 14px;
}

.delete-button {
  padding-inline: 8px;
}

.archive-empty {
  margin-top: var(--space-5);
  padding: var(--space-8) var(--space-5);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: center;
}

.empty-mark {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  width: 40px;
  margin-bottom: var(--space-4);
  padding: 10px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.empty-mark span {
  display: block;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: var(--color-border-strong);
}

.empty-mark span:first-child {
  background: var(--color-primary);
}

.empty-mark span:last-child {
  width: 70%;
}

.archive-empty h2 {
  font-size: var(--font-size-h3);
}

.archive-empty p {
  max-width: 48ch;
  margin: var(--space-2) auto 0;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.archive-empty .button {
  margin-top: var(--space-4);
}

.privacy-tip {
  margin-top: var(--space-5);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

@media (hover: hover) {
  .archive-item:hover .archive-row {
    background: var(--color-bg);
  }

  .load-button:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

@media (max-width: 900px) {
  .history-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .archive-row {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .archive-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
    margin-top: var(--space-1);
  }
}

@media (max-width: 640px) {
  .history-page {
    padding-block: var(--space-5) var(--space-8);
  }

  .history-actions .button {
    flex: 1;
  }

  .archive-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .archive-date {
    flex-direction: row;
    align-items: baseline;
    gap: var(--space-2);
  }

  .archive-actions {
    grid-column: 1;
    margin-top: var(--space-2);
  }

  .archive-main h2 {
    white-space: normal;
  }
}
</style>
