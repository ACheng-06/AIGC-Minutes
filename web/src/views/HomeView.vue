<script setup lang="ts">
import MinutesPreview from '../components/MinutesPreview.vue';
</script>

<template>
  <div class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="home-inner hero-inner">
        <div class="hero-copy">
          <h1 id="hero-title" class="hero-title">
            把会议原文，<br />
            整理成能执行的纪要。
          </h1>
          <p class="hero-lede">
            粘贴会议记录，或上传 TXT、DOCX。AI 提取摘要、关键决策和待办，你再校对、复制、导出
            Word。没有提到的负责人和日期，会保持“未明确”，不会替你补全。
          </p>
          <div class="hero-actions">
            <router-link class="button button-primary" to="/workspace">开始整理会议</router-link>
            <router-link class="text-link" to="/history">查看本地记录</router-link>
          </div>
          <p class="hero-note">无需登录，本地记录只保存在当前浏览器。支持 TXT、DOCX，可导出 Word。</p>
        </div>

        <MinutesPreview class="hero-preview" />
      </div>
    </section>

    <section class="steps" aria-labelledby="steps-title">
      <div class="home-inner">
        <div class="section-heading">
          <h2 id="steps-title">从原文到纪要，只要三步</h2>
          <p>不改变你原本的开会方式，只把整理那一步变短。</p>
        </div>

        <ol class="step-list">
          <li>
            <span class="step-number" aria-hidden="true">1</span>
            <h3>放入原文</h3>
            <p>直接粘贴聊天记录、会议速记，或上传 TXT、DOCX 文件。</p>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">2</span>
            <h3>生成结构</h3>
            <p>AI 会整理出摘要、关键决策和待办，并在缺失信息处留白。</p>
          </li>
          <li>
            <span class="step-number" aria-hidden="true">3</span>
            <h3>校对并带走</h3>
            <p>逐条修改，复制为纯文本，或导出 Word 发给需要的人。</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="outputs" aria-labelledby="outputs-title">
      <div class="home-inner">
        <div class="section-heading">
          <h2 id="outputs-title">一份纪要，三个可用的部分</h2>
          <p>结构固定，内容仍然由你判断。</p>
        </div>

        <div class="output-list">
          <article>
            <h3>会议摘要</h3>
            <p>用几句话说明这次会议谈了什么、结论是什么，方便没参会的人快速了解。</p>
          </article>
          <article>
            <h3>关键决策</h3>
            <p>把已经确认的选择单独列出来，避免和讨论过程混在一起。</p>
          </article>
          <article>
            <h3>待办事项</h3>
            <p>任务、负责人、截止时间分列；没有说清楚的就留空，不编造。</p>
          </article>
        </div>
      </div>
    </section>

    <section class="boundary" aria-labelledby="boundary-title">
      <div class="home-inner boundary-inner">
        <div>
          <h2 id="boundary-title">AI 负责整理，判断仍由你完成</h2>
          <p>
            生成的纪要可能存在遗漏或误读。请在导出前核对关键决策、负责人和时间。
            本地记录只保存在当前浏览器，不会上传到服务器。
          </p>
        </div>
        <router-link class="button button-primary" to="/workspace">整理下一场会议</router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-inner {
  width: 100%;
  max-width: var(--content-home);
  margin: 0 auto;
  padding-inline: var(--content-pad);
}

.hero {
  border-bottom: 1px solid var(--color-border);
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: clamp(32px, 6vw, 80px);
  align-items: center;
  padding-block: clamp(56px, 9vw, 112px) clamp(56px, 8vw, 96px);
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  max-width: 13ch;
  font-size: var(--font-size-display);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.025em;
}

.hero-lede {
  max-width: 54ch;
  margin-top: var(--space-5);
  color: var(--color-fg-muted);
  font-size: clamp(1rem, 1.4vw, 1.125rem);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-5);
  margin-top: var(--space-6);
}

.hero-note {
  max-width: 52ch;
  margin-top: var(--space-5);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
}

.hero-preview {
  min-width: 0;
}

.steps,
.outputs,
.boundary {
  padding-block: clamp(48px, 7vw, 80px);
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2) var(--space-5);
  margin-bottom: var(--space-6);
}

.section-heading h2 {
  font-size: clamp(1.5rem, 2.6vw, 2rem);
}

.section-heading p {
  max-width: 46ch;
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.step-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-6);
  padding: 0;
  margin: 0;
  list-style: none;
}

.step-list li {
  padding-top: var(--space-4);
  border-top: 2px solid var(--color-fg);
}

.step-number {
  display: block;
  margin-bottom: var(--space-3);
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
}

.step-list h3 {
  margin-bottom: var(--space-2);
}

.step-list p {
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.outputs {
  border-block: 1px solid var(--color-border);
  background: var(--color-surface-subtle);
}

.output-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-6);
}

.output-list article {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.output-list h3 {
  margin-bottom: var(--space-2);
}

.output-list p {
  color: var(--color-fg-muted);
  font-size: var(--font-size-small);
}

.boundary-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
}

.boundary-inner > div {
  max-width: 62ch;
}

.boundary p {
  margin-top: var(--space-3);
  color: var(--color-fg-muted);
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .hero-preview {
    order: 2;
  }

  .step-list,
  .output-list {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .boundary-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .hero-title {
    max-width: none;
  }

  .hero-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
