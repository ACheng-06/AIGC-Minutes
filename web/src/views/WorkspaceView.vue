<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import InputPanel from '../components/InputPanel.vue';
import MinutesEditor from '../components/MinutesEditor.vue';
import SourcePanel from '../components/SourcePanel.vue';
import { fetchHealth, generateByFile, generateByText } from '../api/minutes';
import { ApiError, CanceledError } from '../api/http';
import { saveRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import type { GenerateInput } from '../types/minutes';

const { state, setResult, setRecordId, setLoading, setError, setSource } = useMinutesStore();

const backendReachable = ref(true);
const aiConfigured = ref(true);
const inputMode = ref<'input' | 'source'>('input');
const resultHeading = ref<HTMLElement | null>(null);

const showSource = computed(() => inputMode.value === 'source' && state.source !== null);
const inputInitialText = computed(() => (state.source?.kind === 'text' ? state.source.text : ''));

// 同一时间只保留一个生成请求；新请求会中止旧请求，避免两次结果互相覆盖。
let activeController: AbortController | null = null;

onMounted(async () => {
  try {
    const health = await fetchHealth();
    aiConfigured.value = health.aiConfigured;
  } catch {
    backendReachable.value = false;
  }
});

async function handleGenerate(input: GenerateInput): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  setLoading(true);
  setError('');

  try {
    const result =
      input.type === 'text'
        ? await generateByText(input.text, controller.signal)
        : await generateByFile(input.file, controller.signal);

    setResult(result);
    setSource({
      kind: input.type,
      text: input.type === 'text' ? input.text : '',
      fileName: input.type === 'file' ? input.file.name : null,
      charCount: result.meta.charCount,
    });
    inputMode.value = 'source';

    // 生成成功后自动保存一条本地记录；保存失败不影响当前编辑。
    const saved = saveRecord(result.minutes);
    if (saved.record) {
      setRecordId(saved.record.id);
    }
    if (saved.error) {
      ElMessage.warning(saved.error);
    }

    await nextTick();
    resultHeading.value?.focus();
  } catch (error) {
    // 主动取消不算失败，也不覆盖上一次的结果与错误提示。
    if (error instanceof CanceledError) {
      return;
    }
    setError(error instanceof ApiError ? error.message : '生成失败，请稍后重试');
  } finally {
    // 旧请求结束时不复位 loading，避免打断正在等待的新请求。
    if (activeController === controller) {
      activeController = null;
      setLoading(false);
    }
  }
}

function handleCancel(): void {
  // 只发取消信号；loading 由请求的 finally 统一复位。
  activeController?.abort();
}

function handleReinput(): void {
  inputMode.value = 'input';
}
</script>

<template>
  <div class="workspace-page">
    <div class="workspace-inner">
      <header class="page-heading">
        <h1>工作台</h1>
        <p>把会议原文整理成可编辑的纪要。先在左侧放入原文，再在右侧逐条校对。</p>
      </header>

      <p v-if="!backendReachable" class="service-status" role="status">
        无法连接后端服务。请确认后端已启动，再刷新页面。
      </p>
      <p v-else-if="!aiConfigured" class="service-status" role="status">
        后端尚未配置模型。配置 server/.env 中的 LLM 变量并重启后即可生成。
      </p>

      <div class="workspace-grid">
        <div class="workspace-input">
          <InputPanel
            v-if="!showSource"
            :loading="state.loading"
            :initial-text="inputInitialText"
            @generate="handleGenerate"
          />
          <SourcePanel v-else-if="state.source" :source="state.source" @reinput="handleReinput" />
        </div>

        <section class="workspace-result" aria-labelledby="result-title">
          <h2 id="result-title" ref="resultHeading" class="result-title" tabindex="-1">校对与导出</h2>

          <div v-if="state.error" class="result-error" role="alert">
            <p>{{ state.error }}</p>
            <p v-if="state.minutes" class="result-error-note">
              以下是上一次生成的结果，本次请求没有成功。
            </p>
          </div>

          <div v-if="state.loading" class="result-loading" aria-busy="true">
            <el-skeleton :rows="6" animated />
            <p class="loading-text" role="status" aria-live="polite">
              正在整理会议内容，通常需要 10–60 秒……
            </p>
            <el-button class="cancel-button" @click="handleCancel">取消生成</el-button>
          </div>

          <MinutesEditor v-else-if="state.minutes" />

          <div v-else class="empty-result">
            <p class="empty-title">结果会出现在这里</p>
            <p>先在左侧放入会议原文，生成后可以逐条校对、复制或导出 Word。</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-page {
  padding-block: var(--space-6) var(--space-8);
}

.workspace-inner {
  width: 100%;
  max-width: var(--content-workspace);
  margin: 0 auto;
  padding-inline: var(--content-pad);
}

.service-status {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--color-warning);
  background: var(--color-warning-soft);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.workspace-input,
.workspace-result {
  min-width: 0;
}

.result-title {
  margin-bottom: var(--space-3);
  font-size: var(--font-size-h2);
}

.result-title:focus:not(:focus-visible) {
  outline: none;
}

.result-title:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 4px;
}

.result-error {
  margin-bottom: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-left: 3px solid var(--color-danger);
  background: var(--color-danger-soft);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
}

.result-error-note {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
}

.result-loading {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.loading-text {
  margin-top: var(--space-4);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.cancel-button {
  min-height: 44px;
  margin-top: var(--space-4);
}

.empty-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 280px;
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-fg-muted);
}

.empty-title {
  color: var(--color-fg);
  font-family: var(--font-display);
  font-size: var(--font-size-h2);
}

@media (max-width: 1000px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .workspace-page {
    padding-block: var(--space-5) var(--space-7);
  }

  .empty-result {
    min-height: 200px;
    padding: var(--space-4);
  }
}
</style>
