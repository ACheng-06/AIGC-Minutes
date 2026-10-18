<template>
  <figure class="minutes-preview">
    <div class="preview-stack">
      <div class="preview-sheet">
        <div class="preview-source">
          <p class="preview-label">会议原文</p>
          <p class="preview-quote">
            “本周确认首页改版范围，下周三前完成验收；数据看板先不动，等下一轮再排。”
          </p>
        </div>

        <div class="preview-rule">
          <span>整理为</span>
        </div>

        <div class="preview-result">
          <p class="preview-doc-title">产品周会纪要</p>
          <p class="preview-summary">
            会议确认了首页改版的交付范围，并决定本轮不启动数据看板。
          </p>

          <div class="preview-block">
            <p class="preview-label">关键决策</p>
            <p>首页改版按现有范围推进，数据看板延后。</p>
          </div>

          <div class="preview-block">
            <p class="preview-label">待办事项</p>
            <ul class="preview-todos">
              <li>
                <span>完成首页改版验收</span>
                <span class="preview-meta">负责人：未明确 · 截止：未明确</span>
              </li>
              <li>
                <span>整理下一轮数据看板需求</span>
                <span class="preview-meta">负责人：未明确 · 截止：未明确</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <figcaption>示例：负责人和日期不明确时保持“未明确”，不会自动补全。</figcaption>
  </figure>
</template>

<style scoped>
.minutes-preview {
  margin: 0;
}

.preview-stack {
  position: relative;
}

.preview-sheet {
  position: relative;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-sheet);
}

.preview-sheet::before {
  position: absolute;
  top: -8px;
  right: 12px;
  left: 12px;
  height: 8px;
  border: 1px solid var(--color-border);
  border-bottom: 0;
  background: var(--color-surface-subtle);
  content: '';
}

.preview-source {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
}

.preview-label {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.preview-quote {
  margin-top: var(--space-2);
  color: var(--color-fg-strong);
  font-family: var(--font-display);
  font-size: 1rem;
  line-height: 1.7;
}

.preview-rule {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-5);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
}

.preview-rule::before,
.preview-rule::after {
  flex: 1;
  height: 1px;
  background: var(--color-border);
  content: '';
}

.preview-rule span {
  padding-block: var(--space-2);
}

.preview-result {
  padding: var(--space-5);
}

.preview-doc-title {
  color: var(--color-fg);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
}

.preview-summary {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.preview-block {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.preview-block > p:not(.preview-label) {
  margin-top: var(--space-1);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
}

.preview-todos {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  margin: var(--space-2) 0 0;
  list-style: none;
}

.preview-todos li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
  color: var(--color-fg-strong);
  font-size: var(--font-size-small);
}

.preview-meta {
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.minutes-preview figcaption {
  margin-top: var(--space-3);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

@media (max-width: 640px) {
  .preview-source,
  .preview-result {
    padding: var(--space-4);
  }

  .preview-rule {
    padding-inline: var(--space-4);
  }
}
</style>
