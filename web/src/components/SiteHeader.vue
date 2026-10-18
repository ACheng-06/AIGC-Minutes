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
  background: var(--color-bg);
}

.site-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  width: 100%;
  max-width: var(--content-workspace);
  margin: 0 auto;
  padding: var(--space-4) var(--content-pad);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 44px;
  color: var(--color-fg);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-fg);
}

.brand-mark {
  position: relative;
  display: block;
  width: 17px;
  height: 21px;
  border: 1.5px solid var(--color-primary);
  border-radius: 1px;
}

.brand-mark::before,
.brand-mark::after {
  position: absolute;
  right: 3px;
  left: 3px;
  height: 1px;
  background: var(--color-primary);
  content: '';
}

.brand-mark::before {
  top: 6px;
}

.brand-mark::after {
  top: 10px;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.site-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  border-bottom: 2px solid transparent;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
  font-weight: 500;
  text-decoration: none;
}

.site-nav a:hover {
  color: var(--color-fg);
}

.site-nav a.is-active {
  border-bottom-color: var(--color-primary);
  color: var(--color-fg);
  font-weight: 600;
}

@media (max-width: 640px) {
  .site-header-inner {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .site-nav {
    width: 100%;
    justify-content: space-between;
    gap: var(--space-4);
  }
}
</style>
