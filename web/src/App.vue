<script setup lang="ts">
import SiteFooter from './components/SiteFooter.vue';
import SiteHeader from './components/SiteHeader.vue';
</script>

<template>
  <div class="app-frame">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <SiteHeader />

    <main id="main" class="app-main" tabindex="-1">
      <router-view />
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.app-frame {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  min-width: 0;
}
</style>
