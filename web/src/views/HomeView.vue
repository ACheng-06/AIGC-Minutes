<script setup lang="ts">
import MinutesPreview from '../components/MinutesPreview.vue';
</script>

<template>
  <div class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="home-inner hero-inner">
        <div class="hero-copy">
          <p class="hero-eyebrow"><span class="hero-eyebrow-dot" aria-hidden="true"></span>AI 会议纪要 · 从原文到行动</p>
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

        <div class="hero-preview">
          <MinutesPreview />
          <router-link class="demo-link" to="/workspace?demo=1">体验一下 →</router-link>
        </div>
      </div>

      <div class="hero-foot">
        <div class="home-inner hero-foot-inner">
          <ul class="hero-facts">
            <li>支持 TXT / DOCX</li>
            <li>摘要 · 决策 · 待办</li>
            <li>可导出 Word</li>
          </ul>
          <a class="scroll-cue" href="#steps">了解工作方式 <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>

    <section id="steps" class="steps" aria-labelledby="steps-title">
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
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 69px);
  min-height: calc(100svh - 69px);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.hero-inner {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
  gap: clamp(28px, 3.4vw, 48px);
  align-content: center;
  align-items: center;
  width: 100%;
  padding-block: clamp(40px, 5vw, 64px);
}

.hero-copy {
  min-width: 0;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.hero-eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.hero-title {
  max-width: 12ch;
  font-size: var(--font-size-display);
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: -0.03em;
}

.hero-lede {
  max-width: 52ch;
  margin-top: var(--space-5);
  color: var(--color-fg-muted);
  font-size: clamp(1rem, 1.2vw, 1.0625rem);
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

.hero-foot {
  border-top: 1px solid var(--color-border);
}

.hero-foot-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-5);
  padding-block: var(--space-2);
}

.hero-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  padding: 0;
  margin: 0;
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  list-style: none;
}

.hero-facts li {
  position: relative;
}

.hero-facts li + li {
  padding-left: var(--space-4);
}

.hero-facts li + li::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 1px;
  height: 10px;
  background: var(--color-border);
  content: '';
  transform: translateY(-50%);
}

.scroll-cue {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  color: var(--color-fg-muted);
  font-size: var(--font-size-caption);
  font-weight: 500;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.scroll-cue span {
  color: var(--color-primary);
}

.demo-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: var(--space-2);
  color: var(--color-primary);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.steps,
.outputs,
.boundary {
  padding-block: clamp(48px, 6vw, 72px);
}

#steps {
  scroll-margin-top: var(--space-4);
}

.section-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2) var(--space-5);
  margin-bottom: var(--space-5);
}

.section-heading h2 {
  font-size: clamp(1.5rem, 2.2vw, 1.75rem);
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
  border-top: 1px solid var(--color-border);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-bottom: var(--space-3);
  border-radius: var(--radius-xs);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  font-weight: 600;
  line-height: 1;
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
  background: var(--color-surface);
}

.output-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.output-list article {
  padding: 0 var(--space-5);
  border-left: 1px solid var(--color-border);
}

.output-list article:first-child {
  padding-left: 0;
  border-left: 0;
}

.output-list article:last-child {
  padding-right: 0;
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

.boundary h2 {
  font-size: clamp(1.5rem, 2.2vw, 1.75rem);
}

.boundary p {
  margin-top: var(--space-3);
  color: var(--color-fg-muted);
}

@media (hover: hover) {
  .demo-link:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  .scroll-cue:hover {
    color: var(--color-fg);
  }
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: var(--space-7);
  }

  .hero-preview {
    order: 2;
  }

  .step-list,
  .output-list {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }

  .output-list article,
  .output-list article:first-child,
  .output-list article:last-child {
    padding: var(--space-4) 0 0;
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }

  .boundary-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .hero-inner {
    padding-block: var(--space-7) var(--space-6);
  }

  .hero-foot-inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-title {
    max-width: none;
  }

  .hero-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions .button {
    width: 100%;
  }

  .hero-actions .text-link {
    justify-content: center;
  }
}
</style>
