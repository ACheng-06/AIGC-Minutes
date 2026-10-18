<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { clearRecords, listRecords, removeRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import type { LocalMinutesRecord, Minutes } from '../types/minutes';

const router = useRouter();
const { setLoadedRecord } = useMinutesStore();
const records = ref<LocalMinutesRecord[]>([]);

function reload(): void {
  records.value = listRecords();
}

onMounted(reload);

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false });
}

function excerpt(minutes: Minutes): string {
  const text = minutes.summary.replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function handleLoad(record: LocalMinutesRecord): void {
  setLoadedRecord(record);
  ElMessage.success('已载入工作台');
  void router.push('/');
}

function handleRemove(record: LocalMinutesRecord): void {
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
  <div class="history">
    <el-card shadow="never" class="history-card">
      <template #header>
        <div class="history-header">
          <div>
            <span class="history-title">本地记录</span>
            <span class="history-count">共 {{ records.length }} 条 · 最多保留 10 条</span>
          </div>
          <el-button :disabled="records.length === 0" @click="handleClear">清空全部</el-button>
        </div>
      </template>

      <el-empty v-if="records.length === 0" description="还没有本地记录，生成纪要后会自动保存。" />

      <div v-else class="record-list">
        <div v-for="record in records" :key="record.id" class="record-item">
          <div class="record-main">
            <h3>{{ record.minutes.title }}</h3>
            <p class="record-meta">
              {{ formatSavedAt(record.savedAt) }} · {{ record.minutes.todos.length }} 条待办
            </p>
            <p class="record-excerpt">{{ excerpt(record.minutes) }}</p>
          </div>
          <div class="record-actions">
            <el-button size="small" type="primary" plain @click="handleLoad(record)">载入工作台</el-button>
            <el-button size="small" type="danger" plain @click="handleRemove(record)">删除</el-button>
          </div>
        </div>
      </div>

      <p class="privacy-tip">本地记录保存在当前浏览器中，不会上传服务器；共用电脑时请及时清空。</p>
    </el-card>
  </div>
</template>

<style scoped>
.history-card {
  border-radius: 12px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
}

.history-count {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

.record-main {
  min-width: 0;
}

.record-main h3 {
  margin: 0;
  font-size: 15px;
}

.record-meta {
  margin: 4px 0;
  color: #a8abb2;
  font-size: 12px;
}

.record-excerpt {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.privacy-tip {
  margin: 16px 0 0;
  color: #a8abb2;
  font-size: 12px;
}

@media (max-width: 640px) {
  .record-item {
    flex-direction: column;
  }
}
</style>
