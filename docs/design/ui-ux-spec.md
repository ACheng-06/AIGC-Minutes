# AIGC Minutes UI/UX 设计规范

- 版本：v1.0（已实现）
- 日期：2026-10-22
- 范围：仅前端 `web/`；不改后端 API、Schema 或错误码
- 状态：Tasks 1–5 已落地；本文档随 Task 6 同步为最终实现说明

> 本文档描述当前代码中的设计系统，而不是尚未执行的草案。颜色、字体、间距、圆角等视觉值以 `web/src/styles/tokens.css` 为准；页面结构以对应 `.vue` 文件为准。

---

## 1. 设计方向

**现代 SaaS 工作台：冷净浅灰底、白色内容面、深墨文字、单一蓝色强调。**

结构上参考 Linear / Height 的精确与克制，留白参考 Notion；不做 Stripe 式营销页，不复刻复古编辑风，也不使用玻璃拟态、渐变球、3D 或大面积装饰。

核心原则：

1. **先清楚，再好看**：用户能在一屏内看懂“输入原文 → 生成 → 校对/导出”。
2. **一个强调色**：蓝色只用于主操作、当前导航、链接和焦点；其余交给中性色与留白。
3. **表面有层级**：页面底、白色面板、浅灰内嵌区三层足够；不堆叠多层卡片。
4. **动效服务于反馈**：hover、按下、面板进入使用 140–180ms 的短动效；尊重 `prefers-reduced-motion`。
5. **不伪造信息**：负责人、日期缺失时保留“未明确”，示例内容明确标注“示例”。

明确不做：深色模式、外部字体、插画、渐变背景、玻璃拟态、复杂滚动动画、新的 UI 框架。

---

## 2. 信息架构与用户流

### 2.1 路由

| 路径 | 页面 | 职责 |
| --- | --- | --- |
| `/` | `HomeView` | 说明产品价值、展示真实工作台缩略图、引导进入工作台；不放输入框 |
| `/workspace` | `WorkspaceView` | 输入/原文参考 + 纪要编辑、复制、导出、保存 |
| `/history` | `HistoryView` | 本地记录档案索引，最多 10 条 |

路由使用懒加载；每个路由有 `meta.title`，`afterEach` 更新 `document.title`。

### 2.2 核心流程

1. 首页 →「开始整理会议」/「体验一下」→ 工作台。
2. 工作台粘贴文本或上传 TXT/DOCX → 生成。
3. 生成中显示骨架与取消按钮；失败显示错误并保留旧结果。
4. 生成成功 → 左侧折叠为原文参考，右侧进入编辑。
5. 编辑摘要、决策、待办 → 复制 / 导出 Word / 保存到本地。
6. 历史页载入某条记录 → 回到工作台继续编辑；载入前若有未保存修改需确认。

### 2.3 视觉重点

- 首页唯一“有戏”的元素：右侧真实工作台缩略图（原文与纪要并排）。
- 工作台重点是内容本身：输入区与编辑区对齐，标题层级稳定，操作按钮不抢正文。
- 历史页重点是扫描效率：日期、标题、摘要、待办数一眼可读。

---

## 3. 设计 tokens

### 3.1 三层结构

`primitive`（原始色/字号/间距）→ `semantic`（页面语义）→ `Element Plus` 变量映射。组件只使用 semantic 变量，不直接写十六进制颜色。

`tokens.css` 使用 `html:root` 而非 `:root`，以稳定压过按需注入的 Element Plus 根变量；这是本项目处理样式注入顺序的约定。

### 3.2 中性色与品牌色

| Token | 值 | 用途 |
| --- | --- | --- |
| `--slate-50` | `#F7F8FA` | 页面底 |
| `--slate-100` | `#F1F5F9` | 内嵌浅灰区、hover 底 |
| `--slate-200` | `#E2E8F0` | 默认边框/分隔线 |
| `--slate-300` | `#CBD5E1` | 较强边框 |
| `--slate-600` | `#475569` | 次级文字、占位符、元信息 |
| `--slate-700` | `#334155` | 较强正文 |
| `--slate-900` | `#0F172A` | 主文字、标题 |
| `--white` | `#FFFFFF` | 内容面 |
| `--blue-50` | `#EFF6FF` | 当前导航、浅蓝提示底 |
| `--blue-100` | `#DBEAFE` | 浅蓝边框 |
| `--blue-500` | `#3B82F6` | Element Plus light-3 |
| `--blue-600` | `#2563EB` | 主操作、链接、焦点 |
| `--blue-700` | `#1D4ED8` | 主操作 hover |
| `--red-50` | `#FEF2F2` | 错误浅底 |
| `--red-100` | `#FEE2E2` | 错误浅边框 |
| `--red-600` | `#DC2626` | 错误 |
| `--red-700` | `#B91C1C` | 错误 hover |
| `--green-50` | `#F0FDF4` | 成功浅底 |
| `--green-700` | `#15803D` | 成功 |
| `--amber-50` | `#FFFBEB` | 警告浅底 |
| `--amber-700` | `#B45309` | 警告 |

### 3.3 Semantic 变量

| 变量 | 值/来源 | 用途 |
| --- | --- | --- |
| `--color-bg` | `--slate-50` | 页面底 |
| `--color-surface` | `--white` | 卡片、面板、header |
| `--color-surface-subtle` | `--slate-100` | 内嵌区、hover 底 |
| `--color-fg` | `--slate-900` | 主文字 |
| `--color-fg-strong` | `--slate-700` | 强调正文 |
| `--color-fg-muted` | `--slate-600` | 说明、元信息、placeholder |
| `--color-border` | `--slate-200` | 默认边框 |
| `--color-border-strong` | `--slate-300` | 输入/hover 边框 |
| `--color-primary` | `--blue-600` | 主按钮、链接、焦点 |
| `--color-primary-hover` | `--blue-700` | 主按钮 hover |
| `--color-primary-soft` | `--blue-50` | 浅蓝底 |
| `--color-on-primary` | `--white` | 主按钮文字 |
| `--color-danger` | `--red-600` | 错误文字/删除 |
| `--color-danger-soft` | `--red-50` | 错误提示底 |
| `--color-danger-border` | `--red-100` | 错误提示边框 |
| `--color-info` | `--blue-600` | 普通提示/演示提示 |
| `--color-info-soft` | `--blue-50` | 普通提示底 |
| `--color-info-border` | `--blue-100` | 普通提示边框 |
| `--color-success` | `--green-700` | 已生成/已保存 |
| `--color-warning` | `--amber-700` | 警告 |
| `--color-focus` | `--blue-600` | focus ring |

提示色语义：未配置模型是**普通信息**（蓝）；后端不可达/请求失败是**错误**（红）；本地示例是**演示信息**（蓝）。不要把所有提示都画成同一种米黄/棕色。

### 3.4 字体与字阶

不加载外部字体，使用系统无衬线栈：

```text
'SF Pro Text', 'Segoe UI Variable', 'Segoe UI', 'PingFang SC',
'Microsoft YaHei', system-ui, sans-serif
```

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--font-size-display` | `clamp(2.5rem, 3.6vw, 3.5rem)` | 首页主标题 |
| `--font-size-h1` | `clamp(1.75rem, 2.6vw, 2.5rem)` | 页面 H1 |
| `--font-size-h2` | `1.5rem` | 区块/结果标题 |
| `--font-size-h3` | `1.125rem` | 编辑器小节 |
| `--font-size-body` | `1rem` | 正文 |
| `--font-size-small` | `0.875rem` | 说明 |
| `--font-size-caption` | `0.8125rem` | 元信息 |
| `--line-height-heading` | `1.15` | 标题行高 |
| `--line-height-body` | `1.6` | 正文行高 |

### 3.5 间距、圆角、阴影

| 类别 | 值 |
| --- | --- |
| 间距 | `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px` |
| 圆角 | `6 / 8 / 10 / 12px` |
| 阴影 | `0 1px 2px rgb(15 23 42 / 4%)`；`0 1px 2px rgb(15 23 42 / 4%), 0 8px 24px rgb(15 23 42 / 5%)` |

卡片优先使用 1px 边框 + 极浅阴影；不使用大圆角、彩色阴影或多层投影。

### 3.6 Element Plus 映射

在 `tokens.css` 覆盖 `--el-color-primary`、`--el-color-primary-dark-2`、`--el-color-primary-light-*`、错误/成功/警告、文字色、边框色、填充色、圆角、字体和阴影。组件内不再单独重写 Element Plus 的默认主色。

Element Plus 使用 `unplugin-auto-import` + `unplugin-vue-components` 按需引入；`web/src/auto-imports.d.ts` 与 `web/src/components.d.ts` 由构建生成并提交。

### 3.7 对比度

| 组合 | 实测对比度 |
| --- | --- |
| `#0F172A` / `#F7F8FA` | 16.8:1 |
| `#475569` / `#F7F8FA` | 7.13:1 |
| `#FFFFFF` / `#2563EB` | 5.17:1 |
| `#DC2626` / `#FFFFFF` | 4.83:1 |
| `#15803D` / `#FFFFFF` | 5.02:1 |

正文、按钮文字、错误/成功提示和 placeholder 均需 ≥4.5:1；占位符使用 `--slate-600`，不使用更浅的灰。

---

## 4. 布局系统

### 4.1 全站壳

- `SiteHeader`：69px 高、白色表面、1px 底边；左侧蓝色圆角品牌标记 + 站点名；右侧三页导航；当前页为浅蓝 pill。
- `SiteFooter`：白色表面、1px 顶边；左侧 AI 提示 + 本地记录隐私提示；右侧品牌与 GitHub 链接。
- `App.vue`：skip link → header → `main#main` → footer；`main` 使用 `tabindex="-1"` 以支持路由后聚焦。
- 最大宽度：首页 `1240px`，工作台 `1360px`，历史 `1120px`；左右安全边距 `clamp(16px, 4vw, 40px)`。

### 4.2 首页

- 首屏为单列 hero，`min-height: calc(100vh - 69px)`（移动端 `100svh`），内容垂直居中。
- 左栏：eyebrow「AI 会议纪要 · 从原文到行动」、主标题「把会议原文，整理成能执行的纪要」、说明、主 CTA「开始整理会议」、次链接「查看本地记录」。
- 右栏：真实工作台缩略图 `MinutesPreview`，最小高度 420px；桌面网格 `0.82fr / 1.18fr`。
- hero 底部 facts（TXT/DOCX、摘要·决策·待办、Word）与「了解工作方式 ↓」锚点；点击平滑滚动到 `#steps`，尊重 reduced-motion。
- 第二屏：三步流程 + 三个输出 + 边界说明；900px 以下逐步收为单列。
- 首页不放输入框；示例内容标注「示例」。

### 4.3 工作台

- 页面标题 + 说明 + 状态提示；工作区为左右对照。
- 桌面：左栏约 `400px`（输入或原文参考），右栏自适应（结果/编辑器）；`gap: 24–32px`。
- 窄屏（≤1000px）：上下堆叠，先输入/原文，后结果。
- 生成后左侧从 `InputPanel` 切换为 `SourcePanel`，可「重新输入」。
- 右侧空态/加载/错误/结果共用同一容器，避免整页跳动。

### 4.4 本地记录

- 页面标题 + 说明；右上角计数 `3 / 10`、清空全部、新建纪要。
- 白色圆角档案面板，行内：日期/时间列（约 96px）、序号、标题、摘要摘录、待办/决策数、载入/删除。
- 操作按钮 44px；删除二次确认；载入前若当前有未保存修改也需确认。
- 空态为虚线卡片 + 说明 +「去工作台」CTA。
- ≤900px 改为单列，日期/序号/标题/摘要/操作重新排列。

---

## 5. 组件与状态

### 5.1 按钮

- 主按钮：蓝色填充、白色文字、`--radius-sm`、至少 44px 高；hover 变深蓝并轻微上移，active 回落到 0。
- 次按钮：白色表面 + 1px 边框；hover 浅灰底。
- 文本链接：蓝色、下划线偏移；hover 深蓝。
- 禁用：降低对比度但保持可读，`cursor: not-allowed`；不使用仅颜色变化表达状态。

### 5.2 输入与原文

- `InputPanel`：01 步骤徽标、标题、说明；「粘贴文本 / 上传文件」分段 tabs；textarea 可见 label、9 行、字数计数；文件区支持拖拽/点击，TXT/DOCX ≤5MB；主生成按钮全宽。
- 字号/行高保证长文可读；超出字符上限时计数变为警告色并通过 `aria-live` 提示。
- `SourcePanel`：文件类型/名称或「粘贴文本 · 约 N 字符」；内嵌原文 `pre` 可滚动、可键盘聚焦；「重新输入」；底部说明原文不写入本地记录。

### 5.3 纪要预览（首页）

- 白底窗口，顶部文件栏（文件名 + 示例 badge），中部原文/结果双栏，结果栏含「AI 整理」状态、摘要、决策、待办；底部摘要·决策·待办与「缺失信息保持未明确」。
- 移动端上下堆叠，保留完整内容，不截断关键信息。

### 5.4 编辑器

- 白色内容面；标题输入、摘要 textarea、决策列表、待办表格分区。
- 标题/摘要使用可见 label；决策行 hover 出现删除按钮；待办表格在窄屏横向滚动，操作按钮 44px。
- 状态 pill：已生成（绿）、已保存到本地（绿/中性）、有未保存修改（蓝）；`aria-live` 播报保存/复制结果。
- 底部操作：复制、导出 Word、保存到本地；主操作明确，次操作不抢焦点。
- 删除待办使用确认框；导出前校验摘要/任务非空。

### 5.5 提示与空态

| 状态 | 视觉 | 行为 |
| --- | --- | --- |
| 未配置模型 | 蓝色 info 条 | 有示例时只提示示例；无示例时提示配置 `server/.env` |
| 后端不可达/请求失败 | 红色 error 条 | 保留旧结果并说明“本次请求没有成功” |
| 本地示例结果 | 蓝色 demo 条 | 明确“内置示例，仅用于体验” |
| 加载中 | 骨架 + 文案 + 取消 | `aria-busy`，不阻塞输入 |
| 空结果 | 虚线/浅色空态卡 | 提供「用示例原文试试」或返回工作台 |
| 历史空 | 虚线卡片 | 「去工作台」CTA |

---

## 6. 动效与交互

- hover/按下：140–180ms，`cubic-bezier(0.2, 0.8, 0.2, 1)`；主按钮 hover 轻微上移 1px，active 回落。
- 页面切换：不做复杂转场；结果出现使用短淡入/上移，避免布局跳动。
- 首页「了解工作方式」：`scrollIntoView({ behavior: 'smooth' })`，并用 `history.replaceState` 写入 `#steps`；`prefers-reduced-motion` 时直接定位。
- 焦点始终可见：`:focus-visible` 使用 2px 蓝色 ring + 2px offset；不要全局 `outline: none`。唯一例外是鼠标点击结果标题时的 `:focus:not(:focus-visible)`。
- `prefers-reduced-motion: reduce` 时关闭 hover 位移、平滑滚动和骨架动画。

---

## 7. 响应式

| 断点 | 行为 |
| --- | --- |
| ≥1000px | 工作台左右对照；首页左右 hero |
| ≤1000px | 工作台上下堆叠 |
| ≤900px | 首页 hero 单列、步骤单列；历史日期列收缩 |
| ≤720px | 编辑器待办表格横向滚动；编辑区间距收紧 |
| ≤640px | Header 三等分导航；首页/预览/历史全部单列；按钮全宽或 44px |

已在 1440px 桌面与 390px 移动视口检查；页面无横向溢出（`scrollWidth` 不超过视口）。

---

## 8. 可访问性

- 语义结构：每页一个 `h1`；首页/工作台/历史使用 `h1 → h2 → h3`；Header 品牌不是 `h1`。
- 表单：可见 `<label for>`；补充 `aria-describedby`；错误 `role="alert"`；保存/复制状态用 `aria-live="polite"`。
- 键盘：skip link；所有按钮/链接可 Tab；上传入口由 Element Plus 提供 `role="button"`、`tabindex="0"` 和 Enter/Space，不重复添加 tab stop。
- 触控目标：主要按钮、载入/删除、输入操作至少 44×44px。
- 颜色不是唯一信息：状态同时有文字/pill/边框；错误有文案。
- 对比度：见 3.7；placeholder 也必须 ≥4.5:1。
- 动效：尊重 reduced-motion；无自动播放。

---

## 9. 文案与隐私

- 使用「生成纪要」「载入」「导出 Word」「保存到本地」等动作词；避免夸张营销词。
- 缺失负责人/日期写「未明确」，不写“待补充”又不处理；不编造人名、日期、数字。
- 示例内容必须标「示例」；demo 结果必须说明“仅用于体验编辑、复制与导出”。
- 本地记录只存在浏览器；页面明确提示“不会上传服务器；共用电脑请及时清空”。
- 错误文案说明“发生了什么 + 下一步”，例如“后端尚未配置模型：请先配置 server/.env 中的 LLM 变量并重启”。

---

## 10. 实现映射

| 文件 | 职责 |
| --- | --- |
| `web/src/styles/tokens.css` | primitive/semantic/Element Plus 变量；唯一颜色来源 |
| `web/src/styles/main.css` | reset、排版、focus、skip link、容器、按钮、reduced-motion |
| `web/src/components/SiteHeader.vue` | 品牌、三页导航、当前页 pill、移动端三等分 |
| `web/src/components/SiteFooter.vue` | AI 提示、隐私提示、GitHub |
| `web/src/views/HomeView.vue` | 首页 hero、首屏、三步、输出、平滑滚动 |
| `web/src/components/MinutesPreview.vue` | 真实工作台缩略图 |
| `web/src/views/WorkspaceView.vue` | 工作台布局、状态、空态/错误/加载、原文参考 |
| `web/src/components/InputPanel.vue` | 文本/文件输入、校验、示例入口 |
| `web/src/components/SourcePanel.vue` | 生成后的原文参考 |
| `web/src/components/MinutesEditor.vue` | 纪要编辑、状态、复制/导出/保存 |
| `web/src/views/HistoryView.vue` | 本地记录档案索引、载入/删除/空态 |
| `web/src/router/index.ts` | 三页路由、标题、滚动行为 |
| `web/vite.config.ts` | Element Plus 按需引入、`/api` 代理 |
| `web/src/main.ts` | 挂载应用、加载 tokens 与全局样式 |

---

## 11. 验收清单

- [x] 三页路由与页面标题正确，未知路径回到首页。
- [x] 首页首屏完整，示例窗口为真实工作台缩略图，不放输入框。
- [x] 工作台左右对照，生成后切换到原文参考；窄屏上下堆叠。
- [x] 编辑器可改标题/摘要/决策/待办；缺失负责人/日期显示「未明确」。
- [x] 复制、导出 Word、保存到本地可用；导出前有校验。
- [x] 历史页最多 10 条，可载入、单条删除、清空；空态有 CTA。
- [x] 未配置模型、后端不可达、空输入、文件错误均有明确提示。
- [x] 主按钮/导航/操作按钮 hover、focus-visible、44px 触控目标。
- [x] 1440px 与 390px 无横向溢出；reduced-motion 生效。
- [x] Element Plus 按需引入，主包与页面 chunk 低于 500KB 警告线。
- [x] 颜色只从 tokens 读取；页面组件无硬编码颜色。
- [x] 后端 50 个、前端 19 个自动化测试通过；双端 typecheck/build 通过（2026-10-22）。

---

## 12. 设计判断与已知限制

- 选择现代 SaaS 而不是复古编辑风：当前产品是高频工具，清晰、可扫描、低噪音比“纸张感”更重要。
- 选择单一蓝色：减少视觉噪音，让错误红、成功绿和内容本身获得意义。
- 保留 Element Plus 作为组件基础，但按需引入并统一 token；不引入第二套 UI 框架。
- 不做深色模式：当前需求没有要求，增加维护面；未来如做，先补语义 token。
- 不做外部字体：减少网络依赖与首屏抖动。
- 已知限制：没有自动化视觉回归/截图对比；`web/tmp` 截图只用于开发核对，不提交。演示模式、缓存和真实模型行为仍需按 README 手动冒烟。

---

## 13. 后续维护

- 改颜色/字体/间距：先改 `tokens.css`，再改组件；不要直接写十六进制。
- 改页面结构：同步更新本文档第 4、5、10 节。
- 改响应式/可访问性：同步第 7、8 节，并至少复测 1440px 与 390px。
- 改 Element Plus 引入方式或版本：重新检查 `components.d.ts`、`auto-imports.d.ts` 和构建产物体积。
- 提交前运行：后端 `npm run typecheck && npm test && npm run build`；前端同样，并记录实际结果。
