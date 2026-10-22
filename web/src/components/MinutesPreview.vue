<template>
  <figure class="minutes-preview">
    <div class="preview-window">
      <div class="preview-toolbar">
        <div class="preview-file">
          <span class="preview-file-icon" aria-hidden="true"></span>
          <span>产品周会.txt</span>
        </div>
        <span class="preview-chip">示例</span>
      </div>

      <div class="preview-body">
        <section class="preview-pane preview-source" aria-label="会议原文示例">
          <p class="preview-label">会议原文</p>
          <p class="preview-quote">
            “本周确认首页改版范围，下周三前完成验收；数据看板先不动，等下一轮再排。”
          </p>
          <p class="preview-source-note">原文只用于本次整理，不会写入本地记录。</p>
        </section>

        <section class="preview-pane preview-result" aria-label="整理后的纪要示例">
          <div class="preview-result-head">
            <p class="preview-doc-title">产品周会纪要</p>
            <span class="preview-status">
              <span class="preview-status-dot" aria-hidden="true"></span>
              AI 整理
            </span>
          </div>
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
                <span class="preview-todo-task">完成首页改版验收</span>
                <span class="preview-meta">负责人：未明确 · 截止：未明确</span>
              </li>
              <li>
                <span class="preview-todo-task">整理下一轮数据看板需求</span>
                <span class="preview-meta">负责人：未明确 · 截止：未明确</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div class="preview-footer">
        <span>摘要 · 关键决策 · 待办</span>
        <span>缺失信息保持“未明确”</span>
      </div>
    </div>

    <figcaption>示例：负责人和日期不明确时保持“未明确”，不会自动补全。</figcaption>
  </figure>
</template>

<style scoped>
.minutes-preview {
  margin: 0;
}

.preview-window {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 12px var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.preview-file {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-fg-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.preview-file-icon {
  position: relative;
  display: block;
  width: 13px;
  height: 16px;
  flex: 0 0 13px;
  border: 1px solid var(--color-border-strong);
  border-radius: 3px;
  background: var(--color-surface-subtle);
}

.preview-file-icon::before,
.preview-file-icon::after {
  position: absolute;
  left: 3px;
  width: 5px;
  height: 1px;
  background: var(--color-border-strong);
  content: '';
}

.preview-file-icon::before {
  top: 5px;
}

.preview-file-icon::after {
  top: 8px;
}

.preview-chip {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.6875rem;
  font-weight: 600;
}

.preview-body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
}

.preview-pane {
  min-width: 0;
  padding: var(--space-5);
}

.preview-source {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
}

.preview-source-note {
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-fg-muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.preview-label {
  color: var(--color-fg-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.preview-quote {
  margin-top: var(--space-2);
  color: var(--color-fg-strong);
  font-size: 0.9375rem;
  line-height: 1.7;
}

.preview-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.preview-doc-title {
  color: var(--color-fg);
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.preview-status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.preview-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary);
}

.preview-summary {
  margin-top: 6px;
  color: var(--color-fg-muted);
  font-size: 0.8125rem;
  line-height: 1.65;
}

.preview-block {
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.preview-block > p:not(.preview-label) {
  margin-top: var(--space-1);
  color: var(--color-fg-strong);
  font-size: 0.8125rem;
  line-height: 1.6;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px var(--space-3);
  align-items: baseline;
}

.preview-todo-task {
  color: var(--color-fg-strong);
  font-size: 0.8125rem;
}

.preview-meta {
  color: var(--color-fg-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.preview-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-1) var(--space-3);
  padding: 10px var(--space-5);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
  color: var(--color-fg-muted);
  font-size: 0.75rem;
}

.minutes-preview figcaption {
  margin-top: var(--space-2);
  color: var(--color-fg-muted);
  font-size: 0.75rem;
}

@media (hover: hover) {
  .preview-window:hover {
    border-color: var(--color-border-strong);
    box-shadow: 0 1px 2px rgb(15 23 42 / 4%), 0 12px 32px rgb(15 23 42 / 7%);
  }
}

@media (max-width: 640px) {
  .preview-window {
    min-height: 0;
  }

  .preview-body {
    grid-template-columns: 1fr;
  }

  .preview-source {
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .preview-pane {
    padding: var(--space-4);
  }

  .preview-toolbar {
    padding: 10px var(--space-4);
  }

  .preview-footer {
    padding-inline: var(--space-4);
  }

  .preview-todos li {
    grid-template-columns: 1fr;
  }

  .preview-meta {
    white-space: normal;
  }
}
</style>
