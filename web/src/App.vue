<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchHealth } from './api/minutes';

const backendReachable = ref(true);
const aiConfigured = ref(true);

onMounted(async () => {
  try {
    const health = await fetchHealth();
    aiConfigured.value = health.aiConfigured;
  } catch {
    backendReachable.value = false;
  }
});
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <span class="brand-mark">AM</span>
        <div>
          <h1>AIGC Minutes</h1>
          <p>粘贴或上传会议记录，生成可编辑的结构化纪要</p>
        </div>
      </div>
      <nav class="app-nav">
        <router-link to="/">工作台</router-link>
        <router-link to="/history">本地记录</router-link>
      </nav>
    </header>

    <el-alert
      v-if="!backendReachable"
      class="app-alert"
      type="error"
      :closable="false"
      show-icon
      title="无法连接后端服务"
      description="请确认后端已在 http://localhost:3000 启动，然后刷新页面。"
    />
    <el-alert
      v-else-if="!aiConfigured"
      class="app-alert"
      type="warning"
      :closable="false"
      show-icon
      title="后端尚未配置模型"
      description="请在 server/.env 中设置 LLM_BASE_URL、LLM_API_KEY、LLM_MODEL 后重启后端。"
    />

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">AI 生成内容仅供参考，请人工核对后使用。</footer>
  </div>
</template>
