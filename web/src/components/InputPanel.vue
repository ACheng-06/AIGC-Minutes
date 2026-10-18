<script setup lang="ts">
import { ref } from 'vue';
import type { UploadFile, UploadInstance } from 'element-plus';
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB, MAX_TEXT_CHARS } from '../constants';
import type { GenerateInput } from '../types/minutes';

defineProps<{ loading: boolean }>();

const emit = defineEmits<{
  generate: [payload: GenerateInput];
}>();

const activeTab = ref<'text' | 'file'>('text');
const text = ref('');
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
  <el-card shadow="never" class="input-card">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="粘贴文本" name="text">
        <el-input
          v-model="text"
          type="textarea"
          :rows="10"
          resize="vertical"
          :disabled="loading"
          placeholder="把会议记录粘贴到这里，例如：讨论了什么、达成了哪些结论、谁负责哪些后续事项……"
        />
        <div class="char-count" :class="{ 'is-over': text.length > MAX_TEXT_CHARS }">
          {{ text.length }} / {{ MAX_TEXT_CHARS }} 字符
        </div>
      </el-tab-pane>

      <el-tab-pane label="上传文件" name="file">
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
            <p class="upload-hint">支持 TXT、DOCX，单个文件不超过 {{ MAX_FILE_SIZE_MB }}MB</p>
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
      :title="errorMessage"
    />

    <div class="input-actions">
      <el-button type="primary" size="large" :loading="loading" @click="submit">
        生成纪要
      </el-button>
      <span class="action-tip">生成通常需要 10–60 秒，请耐心等待</span>
    </div>
  </el-card>
</template>

<style scoped>
.input-card {
  border-radius: 12px;
}

.char-count {
  margin-top: 6px;
  text-align: right;
  color: #909399;
  font-size: 12px;
}

.char-count.is-over {
  color: #f56c6c;
  font-weight: 600;
}

.upload-text p {
  margin: 0;
}

.upload-hint {
  margin-top: 6px !important;
  color: #909399;
  font-size: 12px;
}

.input-error {
  margin-top: 12px;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.action-tip {
  color: #a8abb2;
  font-size: 12px;
}
</style>
