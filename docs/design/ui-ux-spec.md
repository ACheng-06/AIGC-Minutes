# AIGC Minutes UI/UX 设计规范（阶段 C）

- 版本：v0.1（待确认）
- 日期：2026-10-18
- 范围：仅前端 `web/`；不改后端 API、Schema 或错误码
- 状态：**设计稿，尚未写页面代码**

> 这份文档把阶段 B 已确认的方向落成可执行的 token、布局、组件状态和验收标准。
> 确认后才进入阶段 D 编码；本文件本身不改变任何页面。

---

## 1. 设计 brief

### 1.1 产品

AIGC Minutes 是一个 AI 会议纪要工具：用户粘贴会议原文或上传 TXT/DOCX，服务端提取文本并调用大模型，生成摘要、关键决策、待办事项；用户在浏览器里校对、编辑、复制和导出 Word。没有登录、数据库、云端历史、多人协作。

### 1.2 用户与场景

- 刚开完会、手里有一段很长的会议记录，需要尽快变成可执行的事项。
- 关心的是“结论是什么、谁做什么、什么时候做”，不是“AI 有多酷”。
- 会在桌面浏览器使用，也可能在手机上快速查看/补改。
- 对“AI 编造负责人和日期”有戒心，因此缺失信息必须保持空白并标为“未明确”。

### 1.3 设计要服务的三件事

1. **看懂**：第一次来的人知道这是把会议原文变成结构化纪要的工具。
2. **做完**：从输入到校对、导出，路径短、状态清楚、错误可恢复。
3. **可信**：不伪造人名/日期/数据；本地记录与隐私边界说清楚。

### 1.4 这不是什么

- 不是通用 AI 聊天框。
- 不是项目管理/任务协作平台。
- 不是数据仪表盘，不需要统计图表、增长数字、客户 logo。
- 不是 Element Plus 默认组件的展示页。

---

## 2. 方向：编辑部工作纸

### 2.1 一句话

**暖白纸面 + 墨黑正文 + 钴蓝批注色；衬线标题 + 无衬线正文；细分隔线；一个强视觉元素——首页的“原文 → 纪要”样张。**

### 2.2 为什么是它

会议纪要的原始形态是纸、笔、批注和待办清单。这个方向让界面像一张被认真整理过的工作纸，而不是又一个 SaaS 卡片堆。它同时满足：

- 长文阅读需要稳定的行宽、行高和对比度；
- 摘要是“正文”，决策是“批注”，待办是“清单”，可以用排版而不是装饰来区分；
- 与“AI 会议纪要”这个具体产品有内容关联，不是随便一套模板。

### 2.3 明确拒绝的默认方案

| 方案 | 为什么不用 |
| --- | --- |
| 奶油色 `#F4F1EA` + 陶土色 `#D97757` + 高对比衬线 | 当前 AI 生成页面的高频组合，和本产品没有具体关系 |
| 近黑背景 + 单一荧光绿/朱红 | 像开发者工具或潮流落地页，不适合长时间读会议文本 |
| 大圆角卡片 + 柔和阴影 + 渐变装饰 | 所有内容被切成相同卡片，层级消失；这是本项目要摆脱的现状 |
| `ui-ux-pro-max` 默认返回的 teal `#0D9488` + orange `#EA580C` + Inter | 该结果是通用 SaaS/Flat Design 模板，和“编辑部工作纸”brief 冲突；只把它当作反例，不采用 |
| 全大写 eyebrow、`A · B · C` 元信息、`WORD — fragment` 标签、`→` 追加到每个按钮 | 模板化装饰，不承载信息 |

### 2.4 一个强元素，其余安静

- 唯一允许“有戏”的地方：首页右侧的样张（原文与结构化结果的对照）。
- 工作台、记录页、页头、页脚都保持克制：细线、留白、清楚的字号层级。
- 不使用插画、渐变、玻璃拟态、3D、粒子、滚动动画。
- 编号只用于真实顺序（三步流程），不用 01/02/03 装饰。

---

## 3. 信息架构

### 3.1 路由

| 路径 | name | 页面 | 页面标题 |
| --- | --- | --- | --- |
| `/` | `home` | 产品首页 | `AIGC Minutes｜把会议原文变成可执行的纪要` |
| `/workspace` | `workspace` | 工作台 | `工作台｜AIGC Minutes` |
| `/history` | `history` | 本地记录 | `本地记录｜AIGC Minutes` |
| 其他 | — | 重定向 `/` | — |

- `router.afterEach` 同步 `document.title`；`scrollBehavior` 在路径变化时回顶部，后退时恢复位置。
- 首页不调用后端健康检查；工作台负责显示“后端不可达 / 未配置模型”。
- 旧的 `/` 工作台行为取消：工作台固定为 `/workspace`，首页 CTA 明确进入工作台。
- 静态部署继续依赖现有 SPA fallback；直接刷新 `/workspace`、`/history` 必须可用。

### 3.2 导航

- 顶部：品牌（回首页）+ **首页 / 工作台 / 本地记录**。
- 当前项用下划线 + 墨色文字，不用浅蓝胶囊；Vue Router 的 `aria-current` 保留。
- 移动端允许换行，不做汉堡菜单（只有 3 项）。
- 页脚：AI 内容提示、本地记录隐私说明；GitHub 链接如保留，使用新窗口并加 `rel="noopener noreferrer"`。

### 3.3 核心用户流

```text
首次访问
  / 首页
    → 开始整理会议
      /workspace
        粘贴文本 / 上传 TXT·DOCX
        → 生成纪要
        → 校对摘要、决策、待办
        → 复制 / 导出 Word / 保存到本地
          → 本地记录（可选）
            → 载入工作台（继续编辑）

回访
  / 首页 → 本地记录 → 载入工作台
  /workspace 直接打开 → 输入新会议

失败
  后端不可达 / 未配置模型 / 输入不合法 / AI 超时
    → 工作台内联说明 + 保留当前输入 + 可重试
```

---

## 4. 设计 token

### 4.1 三层结构

采用 primitive → semantic → component 三层；组件只引用 semantic/component，不写裸十六进制。

```text
Primitive   原始值：paper-50、ink-900、cobalt-600、space-4、font-size-body...
Semantic    用途：--color-bg、--color-fg、--color-primary、--color-border...
Component   组件：--button-primary-bg、--input-border、--sheet-bg...
```

### 4.2 Primitive

| Token | 值 | 用途 |
| --- | --- | --- |
| `--paper-50` | `#F8F6F0` | 页面底色 |
| `--paper-100` | `#F1EDE3` | 次级纸面、样张底 |
| `--paper-200` | `#E8E2D4` | 输入框底、选中底 |
| `--ink-900` | `#1C1B18` | 主文字、标题 |
| `--ink-700` | `#3A3832` | 强次级文字 |
| `--ink-600` | `#5C5A52` | 次级文字、说明 |
| `--line` | `#D8D2C4` | 分隔线、边框（不用于正文） |
| `--cobalt-600` | `#1F4FD1` | 主行动、链接、批注 |
| `--cobalt-700` | `#163BA0` | hover/active、深色文字 |
| `--cobalt-100` | `#E6EBFA` | 选中/浅底 |
| `--danger-600` | `#A3312A` | 删除、错误文字 |
| `--danger-100` | `#F7E7E4` | 错误浅底 |
| `--success-700` | `#2F6B4F` | 成功/已保存 |
| `--success-100` | `#E4F0E8` | 成功浅底 |
| `--warning-700` | `#7A4E00` | 警告文字 |
| `--warning-100` | `#F6EBD1` | 警告浅底 |
| `--white` | `#FFFFFF` | 输入框/纸面高光 |

### 4.3 对比度实测

按 WCAG 相对亮度公式计算（普通文字要求 ≥ 4.5:1，大字号 ≥ 3:1）：

| 前景 / 背景 | 比值 | 结论 |
| --- | --- | --- |
| `#1C1B18` / `#F8F6F0` | 15.94:1 | 通过 |
| `#5C5A52` / `#F8F6F0` | 6.39:1 | 通过 |
| `#5C5A52` / `#F1EDE3` | 5.91:1 | 通过 |
| `#1F4FD1` / `#F8F6F0` | 6.27:1 | 通过 |
| `#163BA0` / `#F8F6F0` | 8.97:1 | 通过 |
| `#A3312A` / `#F8F6F0` | 6.41:1 | 通过 |
| `#FFFFFF` / `#1F4FD1` | 6.78:1 | 通过 |
| `#FFFFFF` / `#163BA0` | 9.69:1 | 通过 |
| `#FFFFFF` / `#A3312A` | 6.93:1 | 通过 |
| `#1F4FD1` / `#E6EBFA` | 5.69:1 | 通过 |
| `#2F6B4F` / `#F8F6F0` | 5.82:1 | 通过 |
| `#7A4E00` / `#F6EBD1` | 6.08:1 | 通过 |

> 现有问题对照：`#909399`/白 3.08:1、`#a8abb2`/白 2.30:1、`#409eff`/白 2.78:1，均不满足普通文字要求，阶段 D 必须替换，不能继续作为小字说明色。

### 4.4 Semantic

```css
:root {
  --color-bg: var(--paper-50);
  --color-surface: var(--white);
  --color-surface-subtle: var(--paper-100);
  --color-fg: var(--ink-900);
  --color-fg-muted: var(--ink-600);
  --color-fg-strong: var(--ink-700);
  --color-border: var(--line);
  --color-primary: var(--cobalt-600);
  --color-primary-hover: var(--cobalt-700);
  --color-primary-soft: var(--cobalt-100);
  --color-danger: var(--danger-600);
  --color-danger-soft: var(--danger-100);
  --color-success: var(--success-700);
  --color-success-soft: var(--success-100);
  --color-warning: var(--warning-700);
  --color-warning-soft: var(--warning-100);
  --color-focus: var(--cobalt-600);
}
```

### 4.5 字体与字阶

- 标题/样张：`"Songti SC", "STSong", "Noto Serif CJK SC", Georgia, serif`
- 正文/控件：`"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif`
- 不加载外部字体；不因字体请求阻塞首屏。
- 基础字号 16px，正文行高 1.65；小字不小于 13px；说明文字不用 12px 以下。
- 行长控制在 65ch 左右；标题 `text-wrap: balance`，正文 `text-wrap: pretty` 可用但不强依赖。

| 角色 | 字号 | 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- |
| `display` | `clamp(2.5rem, 6vw, 5rem)` | 1.05 | 500–600 | 首页 H1 |
| `h1` | `clamp(2rem, 3.5vw, 3rem)` | 1.15 | 600 | 工作台/记录页 H1 |
| `h2` | `1.5rem` | 1.3 | 600 | 区块标题 |
| `h3` | `1.125rem` | 1.4 | 600 | 小组标题 |
| `body` | `1rem` | 1.65 | 400 | 正文 |
| `small` | `0.875rem` | 1.55 | 400 | 说明、元信息 |
| `caption` | `0.8125rem` | 1.5 | 500 | 标签、计数 |

数字（日期、条数）使用 `font-variant-numeric: tabular-nums`。

### 4.6 间距、圆角、线条、阴影

- 间距刻度：4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96。
- 圆角：`0`（分隔线/纸面）、`2px`（输入/按钮）、`4px`（小控件）；不使用 12px 全站统一圆角。
- 线条：1px `--color-border`；重要分区可用 2px 墨线。
- 阴影：只给首页样张和编辑器纸面一个很轻的 `0 1px 0 rgba(28,27,24,.06)`；不做悬浮卡片阴影。
- 容器宽度：首页 1200px，工作台 1440px，记录 1100px；左右 padding `clamp(16px, 4vw, 48px)`。
- 断点：640 / 900 / 1200。

### 4.7 Element Plus 映射

在 `tokens.css` 覆盖语义变量，避免在组件里写 `!important`：

```css
:root {
  --el-color-primary: var(--color-primary);
  --el-color-primary-dark-2: var(--color-primary-hover);
  --el-color-danger: var(--color-danger);
  --el-color-success: var(--color-success);
  --el-color-warning: var(--color-warning);
  --el-text-color-primary: var(--color-fg);
  --el-text-color-regular: var(--color-fg-muted);
  --el-border-color: var(--color-border);
  --el-border-radius-base: 2px;
  --el-font-family: var(--font-body);
  --el-bg-color: var(--color-surface);
  --el-fill-color-blank: var(--color-surface);
}
```

阶段 D 逐项验证：主按钮白字、链接、禁用态、日期选择器、对话框、表格/表单标签；不靠肉眼判断对比度。

---

## 5. 布局系统

### 5.1 页面骨架

```text
skip link
SiteHeader（品牌 + 首页/工作台/本地记录）
main#main（tabindex="-1"）
  HomeView | WorkspaceView | HistoryView
SiteFooter（AI 提示 + 本地记录隐私）
```

- `App.vue` 只负责壳、skip link、根据 `route.meta.layout` 加 `layout-home` / `layout-app`。
- 页面自己控制容器宽度；不再用全站 `max-width: 960px` 包住所有页面。
- Header 不 sticky，避免遮挡焦点；如未来要 sticky，必须加 `scroll-margin-top` 并验证。

### 5.2 首页线框（≥1200）

```text
┌──────────────────────────────────────────────────────────────┐
│ AIGC Minutes                         首页  工作台  本地记录   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  把会议原文，                          ┌──────────────────┐  │
│  整理成能执行的纪要。                  │ 界面示例          │  │
│                                        │ 会议原文……        │  │
│  粘贴记录或上传 TXT/DOCX，自动整理      │ ─────────────    │  │
│  摘要、关键决策和待办。负责人、截止     │ 摘要 / 决策 / 待办 │  │
│  时间不明确时保持空白，由你确认。       │ 负责人：未明确     │  │
│                                        └──────────────────┘  │
│  [开始整理会议]  查看本地记录                                │
│  无需登录 · 本地记录只存当前浏览器 · 可导出 Word              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  1 输入原文        2 生成结构        3 校对导出               │
├──────────────────────────────────────────────────────────────┤
│  你会得到：摘要           关键决策           待办事项          │
│  （细线三列，不做三个相同圆角卡片）                            │
├──────────────────────────────────────────────────────────────┤
│  不替你编造负责人和日期 + 末尾 CTA                            │
└──────────────────────────────────────────────────────────────┘
```

- <900：文案 → CTA → 样张 → 三步 → 产出说明；样张不横向溢出。
- 首页不出现输入框；CTA 是 `<router-link>`，不是 `div`/`span` 点击。
- 样张是 `<figure>` + `<figcaption>`，标注“界面示例”；不写假客户名、假统计、假头像。

### 5.3 工作台线框（≥900）

```text
┌──────────────────────────────────────────────────────────────┐
│ SiteHeader                                                   │
├──────────────────────────────────────────────────────────────┤
│ 工作台                                                       │
│ 把会议原文整理成可编辑的纪要                                  │
│ [后端/模型提示，仅在需要时出现]                                │
├───────────────────────┬──────────────────────────────────────┤
│ 左侧 320–380px        │ 右侧 minmax(0, 1fr)                   │
│                       │                                      │
│ 粘贴文本 / 上传文件    │  空状态：生成后在这里校对               │
│ [textarea / upload]   │  或 loading 骨架                       │
│ [生成纪要]            │  或 error 内联说明                     │
│                       │  或 MinutesEditor                     │
│ 生成后：原文参考       │                                      │
│ [重新输入]            │                                      │
└───────────────────────┴──────────────────────────────────────┘
```

- <900：单列；输入/原文在上，结果在下；生成成功把焦点移到结果标题。
- 左侧 `input` / `source` 两态；`source` 只读，不写入 localStorage。
- 右侧 `empty / loading / error / editor` 四态；loading 不伪造百分比。
- 错误与旧结果并存时，错误区必须在结果上方并明确“这是本次生成的错误”，不能静默替换。

### 5.4 本地记录线框（≥900）

```text
┌──────────────────────────────────────────────────────────────┐
│ SiteHeader                                                   │
├──────────────────────────────────────────────────────────────┤
│ 本地记录                                      [清空全部]      │
│ 只保存在当前浏览器，最多 10 条                                │
├──────────────────────────────────────────────────────────────┤
│ 2026-10-18 14:30 │ 产品周会纪要          │ 3 条待办 │ 载入 删除│
│                  │ 摘要摘要摘要……        │          │         │
├──────────────────────────────────────────────────────────────┤
│ 2026-10-17 09:10 │ 客户访谈纪要          │ 0 条待办 │ 载入 删除│
├──────────────────────────────────────────────────────────────┤
│ 隐私提示                                                     │
└──────────────────────────────────────────────────────────────┘
```

- 档案列表：`<ul>` + `<li>` + `<article>`；行与行之间是细线，不是卡片。
- 日期用 `<time datetime>` + tabular-nums；摘要在 2 行内截断。
- 空状态：一句说明 + “去工作台”链接。
- 单条删除必须确认；清空全部保留现有确认；载入前若有 dirty，先确认。

---

## 6. 页面规格

### 6.1 首页 `HomeView.vue`

**区块**

1. Hero：H1、说明、主 CTA、次级链接、信任行。
2. 样张：`MinutesPreview.vue`，静态 `figure`；原文短摘录 + 结构化结果；一条待办空负责人/空日期显示“未明确”；caption 说明“不会替你补全”。
3. 三步：输入原文 → 生成结构 → 校对导出；真实顺序，允许编号。
4. 你会得到：摘要 / 关键决策 / 待办三列；细线分隔。
5. 边界说明：AI 需人工核对；不做登录/云历史/多人协作；不写未实现能力。
6. 末尾 CTA。

**文案基线**

- H1：`把会议原文，整理成能执行的纪要。`
- 说明：`粘贴会议记录或上传 TXT/DOCX，自动整理摘要、关键决策和待办。负责人、截止时间不明确时保持空白，由你确认。`
- 主 CTA：`开始整理会议`
- 次级：`查看本地记录`
- 信任行：`无需登录 · 本地记录只存当前浏览器 · 可导出 Word`
- 样张 caption：`界面示例：不会替你补全负责人或日期。`

**状态**

- 无网络/后端：首页仍完整可读；不显示全局后端错误；CTA 可进入工作台。
- 用户已保存过记录：首页不读取/不展示记录内容；`/history` 才是入口。
- 不显示“最近记录”列表，避免首页变成第二个工作台。

### 6.2 工作台 `WorkspaceView.vue`

**页头**

- H1 `工作台`；说明 `把会议原文整理成可编辑的纪要。`
- 健康提示按需出现：
  - 后端不可达：`无法连接后端` + `请确认后端已启动，然后重试。`
  - `aiConfigured === false`：`后端尚未配置模型` + `请在 server/.env 设置 LLM_BASE_URL、LLM_API_KEY、LLM_MODEL。`
- 提示是内联条，不是全站红色大 alert。

**左侧 `InputPanel`**

- 两个 tab：`粘贴文本` / `上传文件`；tab 用文字 + 下划线，不用胶囊。
- 文本区有可见标签（或 `aria-label`）`会议原文`；字数统计 `aria-live="polite"`；超限时文字 + 颜色双重提示。
- 文件：拖拽/点击；支持 `.txt`、`.docx`，≤5MB，单文件；`.doc` 给出“另存为 .docx”提示。
- 主按钮 `生成纪要`；loading 时禁用输入并显示加载；生成中不允许重复提交。
- 错误靠近输入，`role="alert"`；错误文案给下一步，不只说“失败”。

**左侧 `SourcePanel`（生成成功后）**

- 标题 `原文参考`；文本输入显示只读 `<pre>`，最大高度约 420px，可滚动。
- 文件输入显示文件名、字符数、说明 `DOCX 原文由服务端解析，前端不保留全文。`
- 明确 `原文仅用于本次生成，不写入本地记录。`
- 按钮 `重新输入` 回到 `input`；不清空右侧结果，直到用户重新生成。
- 本地记录载入时没有原文：显示 `该记录来自本地，原文未保存。`，按钮 `重新输入`。

**右侧结果区**

- 空态：`生成后在这里校对摘要、决策和待办。`
- loading：状态卡 + 骨架屏 + `通常需要 10–60 秒`；不显示假进度条。
- error：内联错误 + 当前输入保留；用户可修改后重试；若已有旧结果，保留但标注“以下是上一次结果”，不静默覆盖。
- 成功：`MinutesEditor`。

**生成守卫**

- `state.minutes && state.dirty` → `ElMessageBox.confirm('当前纪要还有未保存修改，重新生成会覆盖。继续？')`。
- 取消：不 setLoading、不清空、不请求。
- 确认：正常生成；成功后 `setResult` + `setSource` + 自动保存本地（保留现有 `saveRecord`）。
- 自动保存失败：warning，不阻断编辑。

**焦点**

- 生成成功后，窄屏把焦点移到结果区 `h2`（`tabindex="-1"`）；不做强制平滑滚动。
- 错误出现时，焦点不抢走输入；用户可用 Tab 到错误区。

### 6.3 编辑器 `MinutesEditor.vue`

**结构**

- 标题输入：`aria-label="纪要标题"`，maxlength 100。
- 区块：`会议摘要`、`关键决策`、`待办事项`，使用 `h2`；页面 H1 只在工作台。
- 摘要：textarea，`show-word-limit`；`aria-label="会议摘要"`。
- 决策：列表；每条输入 `aria-label="第 N 条关键决策"`；删除按钮 `aria-label="删除第 N 条关键决策"`。
- 待办：语义化 grid，不使用固定列宽 `el-table`。
  - 桌面列：任务 `minmax(0,1fr)`、负责人 `150px`、截止 `170px`、操作 `48px`。
  - <900：每条待办变成字段组；可见标签“任务/负责人/截止时间”；纵向排列；不横向滚动。
  - 每个输入有可访问名称；日期使用 `value-format="YYYY-MM-DD"`。
- 操作区：`复制纪要`、`导出 Word`、`保存到本地`；`flex-wrap: wrap`；窄屏按钮可全宽；说明文字可换行。
- dirty 标签：文字 `有未保存修改` / `已保存` + 颜色，不只靠颜色。
- 导出前校验保留：摘要必填、待办任务必填；错误用 message + 字段定位。
- 空决策/空待办显示明确说明，不渲染空表格。

**不拆新组件**：标题、摘要、决策、待办共享同一 dirty/保存生命周期，拆 `TodoEditor` 只会增加转发；除非实现后单文件明显超过约 350 行，再在代码评审时决定。

### 6.4 本地记录 `HistoryView.vue`

- H1 `本地记录`；说明 `只保存在当前浏览器，最多 10 条。`
- 顶部右侧 `清空全部`；无记录时禁用。
- 行：日期 / 标题 + 摘要 / 待办数 / `载入工作台` / `删除`。
- 空态：`还没有本地记录。生成纪要后会自动保存。` + `去工作台` 链接。
- 删除单条：确认 `删除后无法恢复，确定删除这条记录吗？`；确认后 `removeRecord`、reload、成功提示。
- 清空全部：保留现有确认；确认后清空并 reload。
- 载入：若 `state.minutes && state.dirty`，确认 `当前未保存修改会被替换。`；取消则不载入；确认后 `setLoadedRecord`、`router.push('/workspace')`。
- 隐私提示：`本地记录保存在当前浏览器中，不会上传服务器；共用电脑时请及时清空。`
- 移动端：日期/标题/摘要/操作纵向；操作换行；无横向滚动。

### 6.5 全站壳

**SiteHeader**

- 品牌：`AIGC Minutes` 文字 + 一个小钴蓝标记（CSS 方块/短线即可，不引入图标库）；链接 `/`。
- 导航：`首页` `/`、`工作台` `/workspace`、`本地记录` `/history`。
- 当前项：下划线 2px 钴蓝 + `aria-current="page"`；hover 墨色；focus 2px 钴蓝环。
- 移动端：品牌与导航换行；导航项最小 44px 高；不隐藏导航。

**SiteFooter**

- `AI 生成内容仅供参考，请人工核对后使用。`
- `本地记录只保存在当前浏览器。`
- 可选 GitHub 链接；不写未验证指标/许可证声明以外的承诺。

**App.vue**

- skip link 默认视觉隐藏，focus 时显示在左上角。
- `<main id="main" tabindex="-1">`；每页 H1 在 main 内。
- 根据 `route.meta.layout` 加类；首页无全站健康提示。
- 页脚不 sticky；内容短时也不强行贴底（避免布局抖动）。

---

## 7. 组件与状态

| 组件 | 状态 | 规则 |
| --- | --- | --- |
| 主按钮 | default/hover/active/focus/disabled/loading | 深钴蓝底白字；hover 更深；disabled 仍可辨认；loading 保留宽度 |
| 次按钮 | default/hover/focus | 透明底 + 1px 墨线；不抢主按钮 |
| 文字按钮 | hover/focus/danger | 删除类用 danger；focus 环不裁切 |
| 输入/文本域 | default/hover/focus/error/disabled | 1px 线；focus 钴蓝 2px；error 红 + 文案；label 始终存在 |
| Tabs | default/active/focus | 文字 + 下划线；active 钴蓝；键盘左右切换 |
| 上传 | default/dragover/disabled/error | 可点击、可键盘触发；错误靠近控件；不依赖拖拽 |
| 内联提示 | info/warning/error/success | 左侧 2px 色条 + 文字；不使用大圆角 alert 卡 |
| 样张 | static | 纸面 + 细线；只做展示；无假数据 |
| 编辑纸面 | default/dirty/saving | 纸面 + 细线；dirty 有文字标签；保存中禁用保存按钮 |
| 待办行 | default/focus/error | 桌面 grid，移动卡片；输入有标签；删除按钮有 aria-label |
| 记录行 | default/hover/focus | 细线分隔；hover 浅纸色；操作按钮键盘可达 |
| 空状态 | empty | 一句说明 + 一个明确下一步；不放大插画 |
| 确认框 | open/confirm/cancel | 标题说清动作；危险按钮用 danger；Esc 取消；焦点进入对话框 |

**动效**：只允许 hover/focus/loading 的 120–180ms opacity/transform；不做页面加载序列、滚动 reveal、卡片逐个浮现。`prefers-reduced-motion: reduce` 下关闭骨架动画和过渡。

---

## 8. 可访问性验收

按 WCAG 2.2 AA 的最低要求：

- [ ] 每页一个 `h1`；标题层级不跳级。
- [ ] 所有表单控件有可见 `<label>` 或 `aria-label`；占位符不能替代标签。
- [ ] 所有交互可用键盘；无仅 hover/拖拽才能完成的操作。
- [ ] `:focus-visible` 有 2px 钴蓝环 + 2px offset；不写 `outline: none`。
- [ ] 正文/按钮/链接对比度 ≥4.5:1；大字号 ≥3:1（本文件第 4.3 节已算核心组合）。
- [ ] 错误/成功/加载状态用 `role="alert"` 或 `aria-live="polite"`；不抢焦点。
- [ ] 删除/清空/覆盖前有确认；对话框有可读标题和按钮。
- [ ] 触控目标移动端 ≥44×44px；小按钮增加 padding。
- [ ] 图片/装饰图标有 `alt`/`aria-hidden`；本项目尽量不用图标。
- [ ] `prefers-reduced-motion` 生效。
- [ ] skip link 可用；`main` 有 landmark；导航有 `aria-label`。
- [ ] 320px 宽无横向滚动；200% 缩放不丢失功能（抽检）。

**验证方式**：`web-design-guidelines` 的 `file:line` 审查 + 键盘 Tab 手测 + 浏览器对比度抽检；不引入 axe 依赖。

---

## 9. 响应式与内容规则

### 9.1 断点

| 断点 | 行为 |
| --- | --- |
| <640 | 单列；页头换行；首页 H1 缩小；记录行纵向；按钮可全宽 |
| 640–899 | 单列；工作台仍上下；卡片内边距缩小 |
| 900–1199 | 工作台左右分栏（左 320–380）；首页可两栏 |
| ≥1200 | 首页 1200 容器；工作台 1440；记录 1100 |

- 任何宽度都不出现横向滚动；grid/flex 子项 `min-width: 0`；长词 `overflow-wrap: anywhere`。
- 长标题/长负责人/20 条待办/20 条决策都要测试。
- 触控目标在 coarse pointer 下 ≥44px；不依赖 hover。

### 9.2 文案规则

- 中文、主动语态、具体动作；按钮说清楚结果。
- 错误包含“发生了什么 + 下一步”；例：`未配置模型。请在 server/.env 设置 LLM_* 后重启后端。`
- 不写“100% 准确”“完全隐私”“永不丢失”。
- 日期/数字使用 `Intl.DateTimeFormat`/`Intl.NumberFormat`；数字列 tabular-nums。
- 省略号用 `…`，中文引号用“”，不混用英文直引号。

### 9.3 空/错/载状态

| 场景 | 文案方向 |
| --- | --- |
| 工作台无结果 | `生成后在这里校对摘要、决策和待办。` |
| 工作台生成中 | `正在整理会议…` + `通常需要 10–60 秒。` |
| 后端不可达 | `无法连接后端。请确认服务已启动，然后重试。` |
| 未配置模型 | `后端尚未配置模型。请在 server/.env 设置 LLM_* 后重启。` |
| 空决策 | `这次会议没有提取到明确决策，你可以手动添加。` |
| 空待办 | `这次会议没有提取到待办，你可以手动添加。` |
| 历史空 | `还没有本地记录。生成纪要后会自动保存。` + `去工作台` |
| 删除确认 | `删除后无法恢复，确定删除这条记录吗？` |
| 覆盖确认 | `当前纪要还有未保存修改，重新生成会覆盖。继续？` |

---

## 10. 实施映射（阶段 D 使用）

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `web/src/styles/tokens.css` | 新增 | 三层 token + Element Plus 变量覆盖 |
| `web/src/styles/main.css` | 重写 | reset、基础排版、焦点、skip link、容器工具 |
| `web/src/main.ts` | 改 | 引入顺序：Element Plus CSS → tokens → main |
| `web/src/App.vue` | 改 | skip link、SiteHeader/Footer、layout class、移除全站健康 alert |
| `web/src/components/SiteHeader.vue` | 新增 | 品牌 + 三路导航 |
| `web/src/components/SiteFooter.vue` | 新增 | 提示/隐私/链接 |
| `web/src/router/index.ts` | 改 | 三路由、meta、document.title、scrollBehavior |
| `web/src/views/HomeView.vue` | 新增 | 首页 |
| `web/src/components/MinutesPreview.vue` | 新增 | 首页静态样张 |
| `web/src/views/WorkspaceView.vue` | 由 `WorkbenchView.vue` 重命名 | 左右对照 + 四态 |
| `web/src/components/SourcePanel.vue` | 新增 | 原文/文件参考 |
| `web/src/components/InputPanel.vue` | 改 | 标签、aria、换行、token |
| `web/src/components/MinutesEditor.vue` | 改 | 语义标题、响应式待办 grid、焦点 |
| `web/src/views/HistoryView.vue` | 改 | 档案列表、空 CTA、确认、跳 `/workspace` |
| `web/src/composables/useMinutesStore.ts` | 改 | `source` + `setSource`，载入/重置清空 |
| `web/src/types/minutes.ts` | 改 | `SourceSnapshot` |
| `README.md` / `AGENTS.md` | 阶段 D 末更新 | 路由、UI 约定、验收状态 |

**数据流**：`SourceSnapshot { kind: 'text' | 'file'; text: string; fileName: string | null; charCount: number }`；只放内存，不写 localStorage；文本保留原文，文件只保留文件名/字符数。接口与 `GenerateResult` 不变。

**测试**：`useMinutesStore` 的 source 生命周期；router 三路由与 fallback；Home CTA；现有 formatMinutes/download/useLocalMinutes 回归；手动 320/768/1440 与键盘矩阵。

---

## 11. 验收清单

阶段 D 完成后逐项勾选，未实测不勾：

- [ ] `/`、`/workspace`、`/history` 可直达、可刷新、标题正确、fallback 回首页。
- [ ] 首页首屏无输入框；CTA 到 `/workspace`；样张标注“示例”；移动端不溢出。
- [ ] 工作台 ≥900 左右对照，<900 上下；原文参考可用；无原文时说明清楚。
- [ ] 文本/文件生成、失败、dirty 覆盖确认、取消不丢内容。
- [ ] 编辑器增删决策/待办、日期、复制、导出、保存到本地均正常。
- [ ] 历史空态 CTA、载入确认、单条删除确认、清空确认。
- [ ] 每页一个 H1；表单标签/焦点/对比度/键盘/触控目标通过抽检。
- [ ] 320/375/768/900/1024/1440 无横向滚动；`prefers-reduced-motion` 生效。
- [ ] `npm run typecheck`、`npm test`、`npm run build` 实际通过；记录测试数。
- [ ] 后端回归测试通过；未改 API/Schema；未新增依赖。
- [ ] `git status`/`git diff`/`git diff --staged` 检查；无 `.env`/密钥/`node_modules`/`dist` 入暂存。
- [ ] 不 push、不强推、不重置、不删除 `backup/before-email-rewrite`。

---

## 12. 本轮做出的设计判断（请你复核）

这些是为了让规范可执行而由我做出的判断，不是你已经逐条确认的内容：

1. **拒绝 `ui-ux-pro-max` 默认 teal/orange/Inter**：它和“编辑部工作纸”brief 冲突；保留钴蓝/纸色/衬线方向。
2. **不加载外部字体**：用系统中文字体栈，避免网络/首屏依赖；视觉上以字号、字重、间距建立层级。
3. **Header 不 sticky**：避免遮挡焦点和移动端空间；如你希望 sticky，阶段 D 前改规范。
4. **不做深色模式**：当前需求没有要求，先把浅色纸面做扎实。
5. **首页样张是静态示例**：不接真实数据、不写假客户/假统计；只演示“原文 → 结构”。
6. **文件原文不显示全文**：前端不保留 DOCX 全文，只显示文件名/字符数；文本原文保留在内存并可滚动查看。
7. **编辑器不拆 `TodoEditor`**：共享 dirty/保存生命周期，拆分会增加转发；如果实现后超过约 350 行再评估。
8. **不持久化 `design-system/` 目录**：规范放 `docs/design/ui-ux-spec.md`，避免生成未审阅的中间产物。

## 13. 已知工作区状态

- `web/node_modules`、`server/node_modules` 不存在；阶段 D 开始前需要 `npm ci`，本轮不安装。
- `web/package-lock.json` 当前有一处未提交改动：TypeScript 的 `dev: true` → `devOptional: true`。它不属于本设计；阶段 D 开始前需要你确认是保留、提交还是还原，不会擅自处理。
- `main...origin/main` 原本干净；本文件是阶段 C 唯一新增内容。
- 技能已安装并验收：`grill-me`/`grilling`/`using-superpowers`/`frontend-design`/`web-design-guidelines`/`ui-ux-pro-max`/`vue-best-practices`；阶段 C 不调用真实模型。

---

## 14. 下一步

1. 你确认本设计稿（重点看第 4 节 token、第 5 节线框、第 12 节判断）。
2. 确认后进入阶段 D1：安装依赖 → token/壳/路由/首页；每个阶段提交并实际跑 typecheck/test/build。
3. 若你要改方向/token/首页样张，先改本文件，不改页面代码。
