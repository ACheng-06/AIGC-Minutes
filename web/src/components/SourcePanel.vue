<script setup lang="ts">
import type { SourceSnapshot } from '../types/minutes';

defineProps<{ source: SourceSnapshot }>();

const emit = defineEmits<{
  reinput: [];
}>();
</script>

<template>
  <section class="source-panel" aria-labelledby="source-title">
    <div class="source-heading">
      <div>
        <h2 id="source-title">原文参考</h2>
        <p class="source-meta">
          {{ source.kind === 'text' ? '粘贴文本' : '上传文件' }} · 约
          {{ source.charCount.toLocaleString('zh-CN') }} 字符
        </p>
      </div>
      <button type="button" class="source-reinput" @click="emit('reinput')">重新输入</button>
    </div>

    <pre
      v-if="source.kind === 'text'"
      class="source-text"
      tabindex="0"
      aria-label="会议原文内容，可滚动查看"
    >{{ source.text }}</pre>
    <div v-else class="source-file">
      <span class="source-file-label">文件</span>
      <span class="source-file-name" translate="no">{{ source.fileName ?? '未命名文件' }}</span>
      <p>文件内容只在本次生成时读取，不会写入本地记录。</p>
    </div>

    <p class="source-note">原文仅用于本次生成；本地记录不保存原文。</p>
  </section>
</template>

<style scoped>
.source-panel {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.source-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.source-heading h2 {
  font-size: 1.25rem;
  line-height: 1.3;
}

.source-meta {
  margin-top: var(--space-1);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.source-reinput {
  flex-shrink: 0;
  min-height: 36px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
  font-weight: 600;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.source-reinput:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-subtle);
}

.source-text {
  max-height: 380px;
  padding: var(--space-4);
  margin: var(--space-4) 0 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-subtle);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.source-file {
  padding: var(--space-4);
  margin-top: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-subtle);
}

.source-file-label {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.source-file-name {
  display: block;
  margin-top: var(--space-1);
  overflow-wrap: anywhere;
  font-weight: 600;
}

.source-file p {
  margin-top: var(--space-3);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.source-note {
  margin-top: var(--space-4);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .source-panel {
    padding: var(--space-4);
  }

  .source-heading {
    flex-direction: column;
  }
}
</style>
