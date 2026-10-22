<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InputPanel from '../components/InputPanel.vue';
import MinutesEditor from '../components/MinutesEditor.vue';
import SourcePanel from '../components/SourcePanel.vue';
import { fetchHealth, generateByFile, generateByText } from '../api/minutes';
import { ApiError, CanceledError } from '../api/http';
import { saveRecord } from '../composables/useLocalMinutes';
import { useMinutesStore } from '../composables/useMinutesStore';
import { buildDemoResult, DEMO_MEETING_TEXT, isDemoMeetingText } from '../data/exampleMeeting';
import type { GenerateInput } from '../types/minutes';

const route = useRoute();
const router = useRouter();
const { state, setResult, setRecordId, setLoading, setError, setSource } = useMinutesStore();

const backendReachable = ref(true);
const aiConfigured = ref(true);
const inputMode = ref<'input' | 'source'>('input');
const resultHeading = ref<HTMLElement | null>(null);
const demoText = ref('');
/** 演示模式：从示例入口进入后等待用户首次生成；它只决定“未配置时能否用内置结果”。 */
const demoMode = ref(false);
/** 当前结果是否来自未配置模型时的内置示例，用于在结果上方明确标注。 */
const demoFallback = ref(false);

const showSource = computed(() => inputMode.value === 'source' && state.source !== null);
const inputInitialText = computed(
  () => demoText.value || (state.source?.kind === 'text' ? state.source.text : ''),
);

// 同一时间只保留一个生成请求；新请求会中止旧请求，避免两次结果互相覆盖。
let activeController: AbortController | null = null;

onMounted(async () => {
  try {
    const health = await fetchHealth();
    aiConfigured.value = health.aiConfigured;
  } catch {
    backendReachable.value = false;
  }

  if (route.query.demo === '1') {
    // 先消费参数，刷新页面时不会重复自动生成。
    await router.replace({ path: '/workspace' });
    startDemo();
  }
});

/** 进入演示：只填入示例原文，是否生成由用户自己点击。 */
function startDemo(): void {
  demoText.value = DEMO_MEETING_TEXT;
  inputMode.value = 'input';
  demoMode.value = true;
  setError('');
}

/**
 * 未配置模型时的示例体验：加载、取消、元信息、编辑与真实生成保持一致，
 * 只有结果来自内置数据。用户自己输入的原文仍会收到 503，不会被静默替换。
 */
async function runDemoFallback(): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  setLoading(true);
  setError('');

  try {
    // 预留可感知的等待，让加载态和取消按钮与真实流程一致。
    if (await waitForDemo(controller.signal)) {
      return;
    }

    const result = buildDemoResult();
    setResult(result);
    demoFallback.value = true;
    demoText.value = '';
    setSource({
      kind: 'text',
      text: DEMO_MEETING_TEXT,
      fileName: null,
      charCount: result.meta.charCount,
    });
    inputMode.value = 'source';

    await nextTick();
    resultHeading.value?.focus();
  } finally {
    if (activeController === controller) {
      activeController = null;
      setLoading(false);
    }
  }
}

/** 返回 true 表示等待期间用户点了取消。 */
function waitForDemo(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 900);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve(true);
      },
      { once: true },
    );
  });
}

async function handleGenerate(input: GenerateInput): Promise<void> {
  // 内置结果只对“演示模式 + 未配置模型 + 原文仍是完整示例”生效；
  // 用户改过原文或改用文件时必须走真实请求，避免内置结果冒充生成内容。
  const useDemoResult =
    demoMode.value &&
    !aiConfigured.value &&
    input.type === 'text' &&
    isDemoMeetingText(input.text);

  // 首次点击生成即消费演示模式；取消或失败后不会再次自动使用内置结果。
  demoMode.value = false;

  if (useDemoResult) {
    await runDemoFallback();
    return;
  }

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
    // 真实生成成功后不再展示“内置示例”标注。
    demoFallback.value = false;
    // 示例文本已经进入 source，后续“重新输入”应回落到真实原文。
    demoText.value = '';
    setSource({
      kind: input.type,
      text: input.type === 'text' ? input.text : '',
      fileName: input.type === 'file' ? input.file.name : null,
      charCount: result.meta.charCount,
    });
    inputMode.value = 'source';

    // 示例只用于体验，不写入本地记录，避免污染用户自己的纪要列表。
    const isDemoSource = input.type === 'text' && isDemoMeetingText(input.text);
    if (!isDemoSource) {
      const saved = saveRecord(result.minutes);
      if (saved.record) {
        setRecordId(saved.record.id);
      }
      if (saved.error) {
        ElMessage.warning(saved.error);
      }
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

      <div v-if="!backendReachable" class="service-status" role="status">
        <span class="service-dot" aria-hidden="true"></span>
        <p>无法连接后端服务。请确认后端已启动，再刷新页面。</p>
      </div>
      <div v-else-if="!aiConfigured && !state.minutes" class="service-status" role="status">
        <span class="service-dot" aria-hidden="true"></span>
        <p>
          后端尚未配置模型：从示例「体验一下」可查看内置结果；输入自己的原文前，请先配置 server/.env 中的 LLM 变量并重启。
        </p>
      </div>

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
          <header class="result-heading">
            <div>
              <p class="result-eyebrow">OUTPUT</p>
              <h2 id="result-title" ref="resultHeading" class="result-title" tabindex="-1">校对与导出</h2>
            </div>
            <p class="result-hint">生成后可编辑</p>
          </header>

          <div v-if="state.error" class="result-error" role="alert">
            <p>{{ state.error }}</p>
            <p v-if="state.minutes" class="result-error-note">
              以下是上一次生成的结果，本次请求没有成功。
            </p>
          </div>

          <div v-if="demoFallback && !state.loading && state.minutes" class="demo-notice" role="status">
            当前未配置模型，下面是内置示例纪要，仅用于体验编辑、复制与导出。配置 server/.env 后即可生成你自己的纪要。
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
            <span class="empty-kicker">等待生成</span>
            <p class="empty-title">结果会出现在这里</p>
            <p class="empty-copy">先在左侧放入会议原文，生成后可以逐条校对、复制或导出 Word。</p>
            <el-button class="demo-button" size="large" @click="startDemo">用示例原文试试</el-button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-page {
  padding-block: var(--space-6) var(--space-9);
}

.workspace-inner {
  width: 100%;
  max-width: var(--content-workspace);
  margin: 0 auto;
  padding-inline: var(--content-pad);
}

.service-status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: var(--space-4);
  padding: 12px 16px;
  border: 1px solid var(--color-warning-soft);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-sm);
  background: var(--color-warning-soft);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
  line-height: 1.6;
}

.service-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--color-warning);
}

.service-status p {
  margin: 0;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(340px, 400px) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.workspace-input,
.workspace-result {
  min-width: 0;
}

.result-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding-inline: 2px;
}

.result-eyebrow {
  margin-bottom: 2px;
  color: var(--color-fg-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.result-title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.2;
}

.result-hint {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  white-space: nowrap;
}

/* 生成后仅用程序化焦点通知读屏；标题不在 Tab 顺序中，不显示视觉焦点环。 */
.result-title:focus {
  outline: none;
}

.result-error {
  margin-bottom: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-soft);
  border-left: 3px solid var(--color-danger);
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.demo-notice {
  margin-bottom: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-warning-soft);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-sm);
  background: var(--color-warning-soft);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
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
  align-items: center;
  justify-content: center;
  min-height: 440px;
  padding: var(--space-7) var(--space-6);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
  color: var(--color-fg-muted);
  text-align: center;
}

.empty-kicker {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.empty-title {
  margin-top: var(--space-3);
  color: var(--color-fg);
  font-size: 1.35rem;
  font-weight: 600;
}

.empty-copy {
  max-width: 42ch;
  margin-top: var(--space-2);
  line-height: 1.7;
}

.demo-button {
  min-height: 44px;
  margin-top: var(--space-4);
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

  .result-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-1);
  }

  .empty-result {
    min-height: 240px;
    padding: var(--space-5) var(--space-4);
  }
}
</style>
