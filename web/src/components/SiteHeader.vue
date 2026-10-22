<template>
  <header class="site-header">
    <div class="site-header-inner">
      <router-link class="brand" to="/" aria-label="AIGC Minutes 首页">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">AIGC Minutes</span>
      </router-link>

      <nav class="site-nav" aria-label="主导航">
        <router-link to="/" exact-active-class="is-active">首页</router-link>
        <router-link to="/workspace" active-class="is-active">工作台</router-link>
        <router-link to="/history" active-class="is-active">本地记录</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.site-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  width: 100%;
  max-width: var(--content-workspace);
  margin: 0 auto;
  padding: var(--space-3) var(--content-pad);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  color: var(--color-fg);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-fg);
}

/* 用 CSS 画一个简洁的文档标记，避免引入图片资源。 */
.brand-mark {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  border-radius: 5px;
  background: var(--color-primary);
}

.brand-mark::before,
.brand-mark::after {
  position: absolute;
  left: 5px;
  width: 10px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--color-on-primary);
  content: '';
}

.brand-mark::before {
  top: 7px;
}

.brand-mark::after {
  top: 12px;
}

.brand-name {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.site-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-xs);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.site-nav a.is-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}

@media (hover: hover) {
  .site-nav a:hover {
    background: var(--color-surface-subtle);
    color: var(--color-fg);
  }

  .site-nav a.is-active:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
}

@media (max-width: 640px) {
  .site-header-inner {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .site-nav {
    width: 100%;
    justify-content: space-between;
    gap: var(--space-1);
  }

  .site-nav a {
    flex: 1;
    justify-content: center;
    padding: 0 var(--space-2);
  }
}
</style>
