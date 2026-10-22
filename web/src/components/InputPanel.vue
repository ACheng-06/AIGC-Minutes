<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UploadFile, UploadInstance } from 'element-plus';
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB, MAX_TEXT_CHARS } from '../constants';
import type { GenerateInput } from '../types/minutes';

const props = defineProps<{ loading: boolean; initialText?: string }>();

const emit = defineEmits<{
  generate: [payload: GenerateInput];
}>();

const activeTab = ref<'text' | 'file'>('text');
const text = ref(props.initialText ?? '');

// 首页示例或“重新输入”会从外部传入新原文；空值不覆盖用户正在编辑的内容。
watch(
  () => props.initialText,
  (value) => {
    if (value) {
      text.value = value;
    }
  },
);

const selectedFile = ref<File | null>(null);
const fileList = ref<UploadFile[]>([]);
const errorMessage = ref('');
const uploadRef = ref<UploadInstance>();

function validateFile(file: File): string {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.doc')) {
    return '暂不支持旧版 .doc 文件，请另存为 .docx 后重试';
  }

  if (!ACCEPTED_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension))) {
    return '仅支持 TXT 和 DOCX 文件';
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `文件不能超过 ${MAX_FILE_SIZE_MB}MB`;
  }

  return '';
}

function handleFileChange(uploadFile: UploadFile): void {
  const rawFile = uploadFile.raw;
  if (!rawFile) {
    return;
  }

  const validationMessage = validateFile(rawFile);
  if (validationMessage) {
    errorMessage.value = validationMessage;
    selectedFile.value = null;
    fileList.value = [];
    uploadRef.value?.clearFiles();
    return;
  }

  errorMessage.value = '';
  selectedFile.value = rawFile;
  fileList.value = [uploadFile];
}

function handleFileRemove(): void {
  selectedFile.value = null;
  fileList.value = [];
}

function handleExceed(): void {
  errorMessage.value = '一次只能上传一个文件，请先移除已选文件';
}

function submit(): void {
  errorMessage.value = '';

  if (activeTab.value === 'text') {
    const content = text.value.trim();
    if (!content) {
      errorMessage.value = '请先粘贴会议内容';
      return;
    }
    if (text.value.length > MAX_TEXT_CHARS) {
      errorMessage.value = `文本超过 ${MAX_TEXT_CHARS} 字符，请精简后重试`;
      return;
    }
    emit('generate', { type: 'text', text: content });
    return;
  }

  if (!selectedFile.value) {
    errorMessage.value = '请先选择 TXT 或 DOCX 文件';
    return;
  }

  emit('generate', { type: 'file', file: selectedFile.value });
}
</script>

<template>
  <section class="input-panel" :aria-busy="loading" aria-labelledby="input-title">
    <div class="panel-heading">
      <h2 id="input-title">输入会议原文</h2>
      <p>粘贴文本，或上传一个 TXT、DOCX 文件。原文越完整，整理结果越可靠。</p>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="粘贴文本" name="text">
        <label class="field-label" for="meeting-text">会议原文</label>
        <el-input
          id="meeting-text"
          v-model="text"
          name="meeting-text"
          autocomplete="off"
          type="textarea"
          :rows="12"
          resize="vertical"
          :disabled="loading"
          aria-describedby="meeting-text-help"
          :aria-invalid="text.length > MAX_TEXT_CHARS"
          placeholder="把会议记录粘贴到这里，例如：讨论了什么、达成了哪些结论、谁负责哪些后续事项……"
        />
        <div
          id="meeting-text-help"
          class="char-count"
          :class="{ 'is-over': text.length > MAX_TEXT_CHARS }"
          :aria-live="text.length > MAX_TEXT_CHARS ? 'polite' : 'off'"
        >
          {{ text.length }} / {{ MAX_TEXT_CHARS }} 字符
        </div>
      </el-tab-pane>

      <el-tab-pane label="上传文件" name="file">
        <p id="file-hint" class="file-hint">支持 TXT、DOCX，单个文件不超过 {{ MAX_FILE_SIZE_MB }}MB。</p>
        <el-upload
          ref="uploadRef"
          drag
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          accept=".txt,.docx"
          :disabled="loading"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :on-exceed="handleExceed"
        >
          <div class="upload-text">
            <p>拖拽文件到此处，或 <em>点击选择</em></p>
            <p class="upload-hint">一次只能上传一个文件；旧版 .doc 请先另存为 .docx。</p>
          </div>
        </el-upload>
      </el-tab-pane>
    </el-tabs>

    <el-alert
      v-if="errorMessage"
      class="input-error"
      type="error"
      :closable="false"
      show-icon
      role="alert"
      :title="errorMessage"
    />

    <div class="input-actions">
      <el-button type="primary" size="large" class="generate-button" :loading="loading" @click="submit">
        生成纪要
      </el-button>
      <p class="action-tip">生成通常需要 10–60 秒；请保持页面打开。</p>
    </div>
  </section>
</template>

<style scoped>
.input-panel {
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.panel-heading {
  margin-bottom: var(--space-5);
}

.panel-heading h2 {
  font-size: var(--font-size-h2);
}

.panel-heading p {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.input-panel :deep(.el-tabs__header) {
  margin-bottom: var(--space-4);
}

.input-panel :deep(.el-tabs__item) {
  min-height: 44px;
  font-size: var(--font-size-small);
}

.input-panel :deep(.el-textarea__inner) {
  font-size: var(--font-size-body);
  line-height: 1.75;
}

.input-panel :deep(.el-upload-dragger) {
  padding: var(--space-6) var(--space-4);
  border-color: var(--color-border);
  background: var(--color-surface-subtle);
}

.input-panel :deep(.el-upload-dragger:hover) {
  border-color: var(--color-primary);
}

.file-hint {
  margin-bottom: var(--space-3);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.char-count {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  text-align: right;
}

.char-count.is-over {
  color: var(--color-danger);
  font-weight: 600;
}

.upload-text p {
  margin: 0;
}

.upload-text em {
  color: var(--color-primary);
  font-style: normal;
  font-weight: 600;
}

.upload-hint {
  margin-top: var(--space-2) !important;
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.input-error {
  margin-top: var(--space-3);
}

.input-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  margin-top: var(--space-5);
}

.input-actions :deep(.el-button) {
  min-height: 44px;
}

.action-tip {
  max-width: 36ch;
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

@media (max-width: 640px) {
  .input-panel {
    padding: var(--space-4);
  }

  .input-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
