<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { clearRecords, listRecords, removeRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import type { LocalMinutesRecord, Minutes } from '../types/minutes';

const router = useRouter();
const { state, setLoadedRecord } = useMinutesStore();
const records = ref<LocalMinutesRecord[]>([]);

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
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
  <section class="history-page">
    <header class="page-heading">
      <div>
        <h1>本地记录</h1>
        <p class="page-intro">只保存在当前浏览器，最多 10 条。</p>
      </div>
      <el-button :disabled="records.length === 0" @click="handleClear">清空全部</el-button>
    </header>

    <ul v-if="records.length" class="archive-list">
      <li v-for="record in records" :key="record.id" class="archive-item">
        <article class="archive-row">
          <time class="archive-date" :datetime="record.savedAt">{{ formatSavedAt(record.savedAt) }}</time>

          <div class="archive-main">
            <h2>{{ record.minutes.title }}</h2>
            <p class="archive-excerpt">{{ excerpt(record.minutes) }}</p>
          </div>

          <p class="archive-count">{{ record.minutes.todos.length }} 条待办</p>

          <div class="archive-actions">
            <el-button
              link
              type="primary"
              :aria-label="`载入${record.minutes.title}`"
              @click="handleLoad(record)"
            >
              载入工作台
            </el-button>
            <el-button
              link
              type="danger"
              :aria-label="`删除${record.minutes.title}`"
              @click="handleRemove(record)"
            >
              删除
            </el-button>
          </div>
        </article>
      </li>
    </ul>

    <div v-else class="archive-empty">
      <p>还没有本地记录。生成纪要后会自动保存。</p>
      <router-link class="text-link" to="/workspace">去工作台</router-link>
    </div>

    <p class="privacy-tip">本地记录保存在当前浏览器中，不会上传服务器；共用电脑时请及时清空。</p>
  </section>
</template>

<style scoped>
.history-page {
  max-width: 960px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.page-heading h1 {
  font-size: var(--font-size-display);
}

.page-intro {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.page-heading :deep(.el-button) {
  min-height: 44px;
}

.archive-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.archive-item {
  border-bottom: 1px solid var(--color-border);
}

.archive-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 90px auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4) var(--space-2);
}

.archive-date {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
}

.archive-main {
  min-width: 0;
}

.archive-main h2 {
  font-family: var(--font-body);
  font-size: var(--font-size-h3);
  font-weight: 600;
}

.archive-excerpt {
  display: -webkit-box;
  margin-top: var(--space-2);
  overflow: hidden;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.archive-count {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.archive-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

.archive-actions :deep(.el-button) {
  min-height: 44px;
}

.archive-empty {
  padding: var(--space-6) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-fg-muted);
}

.archive-empty p {
  margin-bottom: var(--space-3);
  font-size: var(--font-size-body);
}

.privacy-tip {
  margin-top: var(--space-4);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

@media (max-width: 900px) {
  .archive-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
    padding: var(--space-4) 0;
  }

  .archive-actions {
    justify-content: flex-start;
  }

  .page-heading {
    flex-direction: column;
  }
}
</style>
