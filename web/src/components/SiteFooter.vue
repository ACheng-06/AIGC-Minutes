<template>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <p>AI 生成内容仅供参考，请人工核对后使用。本地记录只保存在当前浏览器。</p>
      <p class="site-footer-links">
        <span translate="no">AIGC Minutes</span>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/ACheng-06/aigc-minutes" target="_blank" rel="noopener noreferrer">
          GitHub 源码
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.site-footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  max-width: var(--content-workspace);
  margin: 0 auto;
  padding: var(--space-5) var(--content-pad);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.site-footer-links {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.site-footer a {
  color: var(--color-fg-muted);
  text-underline-offset: 0.2em;
}

.site-footer a:hover {
  color: var(--color-fg);
}
</style>
