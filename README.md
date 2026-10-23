# AIGC Minutes

把会议原文，整理成能执行的纪要。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-4-3E67B1)
![License](https://img.shields.io/badge/License-MIT-yellow)

AIGC Minutes 是一个 AI 会议纪要工具：粘贴会议原文，或上传 TXT / DOCX 文件，后端提取文本并调用任意 OpenAI 兼容模型，生成结构化纪要——**会议摘要、关键决策、待办事项**。结果可以在线编辑、复制为纯文本、导出 Word，并在浏览器本地保留最近 10 条记录。

> 当前状态：MVP 已完成。后端 50 个、前端 19 个自动化测试通过，双端 typecheck / build 通过（2026-10-23）。真实模型调用需要配置 API Key 后按「真实模型冒烟」清单手动验证。

## 目录

- [它解决什么问题](#它解决什么问题)
- [功能](#功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [使用流程](#使用流程)
- [架构](#架构)
- [关键设计](#关键设计)
- [API](#api)
- [测试与验证](#测试与验证)
- [部署](#部署)
- [已知限制](#已知限制)
- [项目结构](#项目结构)
- [AI 协作说明](#ai-协作说明)
- [隐私说明](#隐私说明)
- [License](#license)

## 它解决什么问题

会议记录通常是长文本、口语化、信息密度低。整理成纪要需要反复读、提取结论、确认谁在什么时候做什么。直接问聊天机器人也能得到一段总结，但它不是可交付的产物：结构不固定、不能逐条修改、不方便复制和导出。

AIGC Minutes 把这件事做成一条可校对的工作流：

- 输入原文，生成固定结构的摘要、决策、待办；
- 缺失的负责人或截止日期显示「未明确」，不替用户编造；
- 结果可以逐条编辑，复制为纯文本，或导出统一版式的 Word；
- 最近 10 条记录只存在浏览器，不上传服务器。

它不是聊天框，而是一个带边界的小工具。

## 功能

| 模块 | 能力 |
| --- | --- |
| 输入 | 粘贴文本；上传单个 TXT / DOCX（≤ 5MB）；拖拽或点击；前后端双重校验 |
| 生成 | 任意 OpenAI 兼容接口；结构化 JSON 输出；失败一次修复；超时与上游异常分类 |
| 结果 | 摘要、关键决策、待办（任务 / 负责人 / 截止日期）；缺失信息显示「未明确」 |
| 编辑 | 标题、摘要、决策、待办；新增 / 删除；未保存状态提示 |
| 输出 | 一键复制纯文本；服务端生成 `.docx`；中文文件名 |
| 本地记录 | 最近 10 条；载入、单条删除、清空；只存当前浏览器 |
| 体验 | 三页路由；响应式；空态 / 加载 / 错误 / 演示态；生成中可取消 |
| 部署 | 前后端分离；或单进程由后端托管 `web/dist` |

明确不做：登录注册、数据库、Redis / 消息队列 / 微服务、多人协作、权限系统、RAG / 向量库、长文档分块、管理后台、PDF / OCR、流式输出。范围边界也写在 [`AGENTS.md`](AGENTS.md) 里。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Vue Router、Element Plus（按需引入）、Axios |
| 后端 | Node.js、Express 4、TypeScript、Zod、Multer、Mammoth、docx |
| AI | 任意 OpenAI 兼容接口 |
| 测试 | Vitest、Supertest、@vue/test-utils（jsdom） |

## 快速开始

### 环境要求

- Node.js ≥ 20.19（本项目在 22.20.0 验证）
- npm ≥ 10
- 一个支持 `POST {BASE_URL}/chat/completions` 的 OpenAI 兼容服务

你需要自己准备 API Key。项目不内置任何密钥，也不会替你申请。

### 1. 安装依赖

```powershell
git clone https://github.com/ACheng-06/AIGC-Minutes.git
cd AIGC-Minutes

cd server
npm install

cd ..\web
npm install
```

### 2. 配置后端环境变量

```powershell
cd server
Copy-Item .env.example .env
```

编辑 `server/.env`，至少填写：

```dotenv
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_API_KEY=你的密钥
LLM_MODEL=deepseek-chat
```

常见配置示例（以服务商当期文档为准）：

| 服务 | `LLM_BASE_URL` | `LLM_MODEL` 示例 |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 本地 Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` |

Ollama 可以把 `LLM_API_KEY` 填成任意占位值（例如 `ollama`）；三项 LLM 配置齐全才视为可用。

### 3. 启动开发环境

两个终端分别启动：

```powershell
# 终端 1：后端 http://localhost:3000
cd server
npm run dev
```

```powershell
# 终端 2：前端 http://localhost:5173
cd web
npm run dev
```

Vite 已把 `/api` 代理到 `http://localhost:3000`，开发时不需要处理跨域。

### 4. 验证

```powershell
curl.exe http://localhost:3000/api/health
```

成功时返回：

```json
{
  "data": {
    "status": "ok",
    "aiConfigured": true,
    "timestamp": "2026-10-23T08:00:00.000Z"
  }
}
```

打开 `http://localhost:5173`，从首页进入工作台。没有配置 Key 时服务仍可启动：`/api/health` 返回 `aiConfigured: false`，生成接口返回 503，首页的「体验一下」仍可查看内置示例（仅限示例原文）。

## 环境变量

`server/.env`：

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3000` | 后端端口 |
| `NODE_ENV` | 否 | `development` | `development` / `test` / `production` |
| `LLM_BASE_URL` | 是 | 无 | OpenAI 兼容接口根地址（不含 `/chat/completions`） |
| `LLM_API_KEY` | 是 | 无 | 只在后端读取，不返回前端、不写入日志 |
| `LLM_MODEL` | 是 | 无 | 模型名称 |
| `LLM_TIMEOUT_MS` | 否 | `60000` | 模型调用超时（毫秒） |
| `MAX_TEXT_CHARS` | 否 | `30000` | 单次生成允许的最大字符数 |
| `MAX_FILE_SIZE_MB` | 否 | `5` | 上传文件大小上限 |
| `WEB_DIST` | 否 | 无 | 前端构建产物目录，用于单进程部署 |

`web/.env`（可选）：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 留空时使用 `/api` + Vite 代理；前后端不同域时填写包含 `/api` 的完整地址，例如 `https://api.example.com/api` |

`web/src/constants.ts` 中的输入限制与后端默认值保持一致，修改时请同步。

## 使用流程

1. 首页 → 「开始整理会议」或「体验一下」→ 工作台。
2. 粘贴原文，或上传 TXT / DOCX → 点击「生成纪要」。
3. 生成中显示骨架和取消按钮；失败时保留上一次结果并说明原因。
4. 生成成功后，左侧切换为原文参考，右侧进入编辑。
5. 编辑摘要、决策、待办 → 复制 / 导出 Word / 保存到本地。
6. 历史页载入某条记录 → 回到工作台继续编辑。

示例体验只填入原文，不会自动生成；未配置模型时，只有原文与示例完全一致才返回内置结果，并在结果上方明确标注。用户改动原文后仍走真实请求。

## 架构

```text
Browser
  Vue 3 + TypeScript + Vue Router + Element Plus (on-demand)
  Axios + AbortController        localStorage (10 records)
        │ /api
        ▼
Express 4 + TypeScript
  routes → middleware(upload / error) → services
  extractText    TXT / DOCX → 规范化文本
  ai             提示词 → LLM → Zod 校验 → 一次修复 → 确定性后处理
  minutesCache   sha256 + model + version，30min / 50 条
  exportDocx     纪要 → .docx
        │ HTTPS
        ▼
OpenAI-compatible /chat/completions
```

| 层 | 职责 | 关键文件 |
| --- | --- | --- |
| 路由 | 参数校验、Content-Type 分流、错误映射 | `server/src/routes/minutes.route.ts` |
| 文本提取 | TXT / DOCX → 纯文本，编码与长度校验 | `server/src/services/extractText.ts` |
| AI | 调模型、解析 JSON、失败修复一次 | `server/src/services/ai.ts` |
| 业务编排 | 生成 + 缓存 + 元信息 | `server/src/services/minutes.ts` |
| 缓存 | 进程内 LRU，30 分钟 TTL | `server/src/services/minutesCache.ts` |
| 导出 | 生成固定版式 Word | `server/src/services/exportDocx.ts` |
| 前端状态 | 当前纪要、加载、错误、脏状态 | `web/src/composables/useMinutesStore.ts` |
| 本地记录 | localStorage 读写、配额降级 | `web/src/composables/useLocalMinutes.ts` |

## 关键设计

### 1. 模型输出是不可信输入

提示词要求模型只输出 JSON，并明确「原文没有负责人 / 日期就留空」。但提示词只是第一道约束：服务端用 Zod 校验结构，失败时把字段错误回灌给模型，只修复一次；仍失败返回 `AI_INVALID_OUTPUT`（502）。通过校验后还有确定性后处理：重复的决策 / 待办先去重再截断，「未明确 / 待定 / TBD」归一为空，非 `YYYY-MM-DD` 或日期不存在的值归空。即使模型输出 Markdown 围栏、缺字段或写「下周五」，也不会污染最终数据。

代价是复杂日期会被保守丢弃，需要用户在编辑区补全；这是「宁可不猜，也不编造」的选择。

### 2. 缓存不是「加个 Map」

相同原文 + 相同模型的重复生成会命中进程内缓存：key 是 `sha256(原文) + 模型名 + 规则版本`，30 分钟 TTL，最多 50 条，命中后移到 Map 末尾实现 LRU。只有成功结果才写入缓存，失败不会留下「坏缓存」。缓存不落盘，重启即失效，避免长期保留会议原文的派生数据。

代价是多实例不共享；如果部署多个副本，需要把这一层换成 Redis，并保留同样的 key 设计。

### 3. 取消、超时、旧请求

前端用 `AbortController` 管理生成请求：用户取消单独建模为 `CanceledError`，不复用后端错误码；新请求会 abort 旧请求，旧请求的 `finally` 通过 `activeController === controller` 判断，避免把新请求的 loading 复位。取消和失败都不会覆盖上一次成功结果。

这样「连续点两次生成」「生成中取消」「生成中报错」不会出现结果错乱。代价是取消语义需要在前端单独维护，不能直接复用统一的 `ApiError`。

### 4. 文件解析先校验内容，再相信扩展名

上传入口先按扩展名白名单过滤，再检查 DOCX 的 ZIP 魔数 `PK\x03\x04`，防止改后缀绕过；TXT 先以 `fatal: true` 严格 UTF-8 解码，失败回退 GBK，兼容中文 Windows 保存的文本。粘贴和上传共用同一套换行 / 空行规范化、空内容校验和 3 万字符上限，保证两个入口行为一致。

文件在内存中处理，单文件 ≤ 5MB；这是 MVP 的取舍，大文件应改为流式或临时文件。

### 5. 契约同步，而不是「两边都写一遍」

`server/src/schemas/minutes.ts` 同时约束 AI 输出和接口入参，前端 `web/src/types/minutes.ts` 与它手工同步：字段名、必填性、长度上限必须一致，修改任一端要在同一提交同步另一端。接口统一返回 `{ data }` 或 `{ error: { code, message, details } }`，共 15 个错误码，前端按 code 做差异化提示，未知 code 回退为网络 / 未知错误。

没有上 OpenAPI 或代码生成，是因为当前接口面很小；团队变大后应改为 `z.infer` 导出或 OpenAPI 生成。

### 6. 设计 token 与可访问性

颜色只从 `web/src/styles/tokens.css` 读取，按 primitive → semantic → Element Plus 三层组织，组件不写死十六进制。`tokens.css` 使用 `html:root` 而不是 `:root`，以稳定压过按需注入的 Element Plus 根变量。页面按 1440px 和 390px 两个视口验收，无横向溢出；正文、按钮、错误、成功、placeholder 的对比度均 ≥ 4.5:1（最低 4.83:1）。

可访问性包括 skip link、可见 label、`aria-live`、`focus-visible`、44px 触控目标和 `prefers-reduced-motion`。完整规范见 [`docs/design/ui-ux-spec.md`](docs/design/ui-ux-spec.md)。

## API

Base URL：`http://localhost:3000/api`。成功响应统一为 `{ "data": ... }`，失败统一为：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法",
    "details": [{ "path": "text", "message": "文本不能为空" }]
  }
}
```

### `GET /api/health`

```json
{
  "data": {
    "status": "ok",
    "aiConfigured": true,
    "timestamp": "2026-10-23T08:00:00.000Z"
  }
}
```

`aiConfigured` 只检查三项 LLM 环境变量是否齐全，不真实调用模型。

### `POST /api/minutes/generate`

两种请求方式，按 `Content-Type` 区分：

JSON：

```json
{ "text": "会议原文……" }
```

multipart/form-data：字段 `file`，单个 `.txt` / `.docx`，≤ 5MB。

成功响应：

```json
{
  "data": {
    "minutes": {
      "title": "产品周会纪要",
      "summary": "本次会议……",
      "decisions": ["确认 11 月上线 MVP"],
      "todos": [
        { "task": "完成导出联调", "owner": "张三", "dueDate": "2026-10-23" },
        { "task": "整理接口文档", "owner": "", "dueDate": "" }
      ]
    },
    "meta": {
      "sourceType": "file",
      "fileName": "weekly.docx",
      "charCount": 1842,
      "generatedAt": "2026-10-23T08:00:00.000Z",
      "cached": false
    }
  }
}
```

`owner` / `dueDate` 为空字符串表示「未明确」；`dueDate` 只接受 `YYYY-MM-DD`，其他写法会被归一为空。`cached: true` 表示命中服务端内存缓存（原文与模型都相同，30 分钟内），此时 `generatedAt` 是首次生成时间。

PowerShell 示例：

```powershell
$body = @{ text = "会议原文……" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/minutes/generate `
  -Method Post -ContentType "application/json" -Body $body
```

### `POST /api/minutes/export`

请求体：

```json
{
  "minutes": {
    "title": "……",
    "summary": "……",
    "decisions": ["……"],
    "todos": []
  }
}
```

成功返回 `application/vnd.openxmlformats-officedocument.wordprocessingml.document` 二进制，并带下载文件名。请求体上限 1MB，摘要必填，决策最多 20 条，待办最多 20 条。

PowerShell 示例：

```powershell
$body = @{
  minutes = @{
    title = "周会"
    summary = "会议摘要……"
    decisions = @("确认上线时间")
    todos = @()
  }
} | ConvertTo-Json -Depth 5

Invoke-WebRequest -Uri http://localhost:3000/api/minutes/export `
  -Method Post -ContentType "application/json" -Body $body -OutFile minutes.docx
```

### 错误码

| code | HTTP | 场景 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 字段 / JSON / Zod 校验失败 |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | 既不是 JSON 也不是 multipart |
| `UNSUPPORTED_FILE_TYPE` | 415 | 非 TXT / DOCX、旧版 `.doc`、伪造 DOCX |
| `FILE_TOO_LARGE` | 413 | 文件超过大小限制 |
| `PAYLOAD_TOO_LARGE` | 413 | 请求体超过 1MB |
| `CONTENT_TOO_LONG` | 422 | 提取文本超过字符上限 |
| `FILE_PARSE_ERROR` | 422 | DOCX 损坏或文本解码失败 |
| `EMPTY_CONTENT` | 422 | 没有有效文本 |
| `AI_NOT_CONFIGURED` | 503 | 缺少 LLM 配置 |
| `AI_TIMEOUT` | 504 | 模型响应超时 |
| `AI_UPSTREAM_ERROR` | 502 | 模型服务非 2xx / 网络异常 / 空响应 |
| `AI_INVALID_OUTPUT` | 502 | 结构化校验两次仍失败 |
| `EXPORT_ERROR` | 500 | Word 生成失败 |
| `NOT_FOUND` | 404 | 未知路由 |
| `INTERNAL_ERROR` | 500 | 未预期异常 |

前端另外定义了 `NETWORK_ERROR` 和 `UNKNOWN_ERROR` 作为客户端兜底，不进入后端错误码契约。

## 测试与验证

最近一次实际运行（2026-10-23）：

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 后端类型检查 | `cd server; npm run typecheck` | 通过 |
| 后端测试 | `cd server; npm test` | 5 个文件 / 50 个用例通过 |
| 后端构建 | `cd server; npm run build` | 通过 |
| 前端类型检查 | `cd web; npm run typecheck` | 通过 |
| 前端测试 | `cd web; npm test` | 5 个文件 / 19 个用例通过 |
| 前端构建 | `cd web; npm run build` | 通过 |

构建产物：主 JS 约 121 kB（gzip 47 kB），最大页面 chunk `WorkspaceView` 约 351 kB（gzip 117 kB），低于 500 kB 体积告警线。

覆盖范围：Zod 归一化、决策 / 待办去重与超量裁剪、TXT / DOCX 提取（含 GBK、损坏文件）、AI JSON 解析与一次修复、超时 / 上游异常、缓存命中与失败不写缓存、输入校验、文件大小、导出 docx、localStorage 上限与配额异常。

自动化测试不调用真实模型：API 测试 mock AI 服务，AI 测试 mock `fetch`。

**真实模型冒烟（需要你的 Key，本仓库未执行）：**

1. 配置 `server/.env` 后启动前后端。
2. 粘贴一段真实会议文本，确认摘要 / 决策 / 待办合理。
3. 上传真实 DOCX，确认中文提取正常。
4. 修改内容后复制、导出 Word，用 Word / WPS 打开确认版式。
5. 故意填错 Key 或断网，确认页面显示可理解的错误。

> 项目中任何「测试通过 / 构建成功」的结论都以实际命令输出为准。

## 部署

### 方案 A：前后端分离

1. `cd web; npm run build`，把 `web/dist` 交给 Nginx 或静态托管。
2. `/api` 反向代理到 Node 后端。
3. 后端只配置环境变量，不提交 `.env`。

### 方案 B：单进程（已支持）

```powershell
cd web
npm run build

cd ..\server
npm run build

$env:NODE_ENV = 'production'
$env:WEB_DIST = '../web/dist'
npm start
```

打开 `http://localhost:3000`。`WEB_DIST` 未设置或目录不存在时，后端只提供 API。

安全提示：项目没有登录 / 鉴权，请勿在公网公开部署并携带真实 Key。如需公网使用，请先增加访问控制。

## 已知限制

- 不做登录 / 鉴权；不能直接公网部署。
- 不做数据库 / Redis；缓存只在进程内，多实例不共享，重启失效。
- 不做流式输出；生成通常需要 10–60 秒，可随时取消。
- 不做长文档分块；上限 30000 字符，超出会明确报错，不会静默截断。
- localStorage 最多 10 条；共用电脑请及时清空。
- 未实现自动重试、限流、鉴权；AI 调用失败由用户手动重试。
- 真实模型调用需要你自己的 Key，仓库未执行；自动化测试不调用真实模型。
- 没有自动化视觉回归 / 截图对比；`web/tmp` 截图只用于开发核对，不提交。

## 项目结构

```text
AIGC Minutes/
├── server/
│   ├── src/
│   │   ├── app.ts                  # Express 装配（便于 supertest）
│   │   ├── index.ts                # 启动与优雅退出
│   │   ├── env.ts                  # 环境变量解析与校验
│   │   ├── routes/                 # /api/minutes
│   │   ├── middleware/             # 上传、统一错误处理
│   │   ├── services/               # extractText / ai / minutes / minutesCache / exportDocx
│   │   ├── schemas/                # Zod 规则（AI 输出与接口共用）
│   │   └── lib/                    # AppError、日志
│   └── tests/                      # 50 个后端测试
├── web/
│   └── src/
│       ├── api/                    # axios 实例与接口函数
│       ├── components/             # 输入、原文参考、纪要预览与编辑器
│       ├── composables/            # 当前纪要状态、localStorage 历史
│       ├── data/                   # 示例原文与内置示例纪要
│       ├── router/                 # 三页路由与标题
│       ├── styles/                 # tokens.css、main.css
│       ├── types/                  # 与后端手工同步的类型
│       ├── utils/                  # 复制、文本格式化、下载、文件名
│       └── views/                  # HomeView、WorkspaceView、HistoryView
├── docs/design/ui-ux-spec.md       # UI/UX 设计规范
├── AGENTS.md                       # 开发约定与协作规范
├── README.md
└── LICENSE
```

前端测试与对应模块放在同一目录（`api/`、`composables/`、`data/`、`utils/`），共 19 个。

## AI 协作说明

本项目以 AI Agent 为主要实现方式，人类负责需求收敛、接口契约、任务拆解、代码审查与验收。开发约定写在 [`AGENTS.md`](AGENTS.md)：第一版不做清单、前后端类型同步规则、提交前 `typecheck / test / build` 门禁、提交信息格式。项目按可验证阶段拆分提交，功能与测试放在同一提交。

这不是「让 AI 一次性生成一个项目」，而是把 AI 放进一个有边界、有验收标准的流程里。README 中的测试数量、构建结果和已知限制，都是这个流程的一部分。

## 隐私说明

- API Key 只通过后端环境变量读取，不返回前端、不写入日志。
- 会议原文会发送给你配置的模型服务商，请遵守其数据政策。
- 本地记录只存在当前浏览器，不会上传服务器。
- 示例结果会明确标注「仅用于体验」，不会写入本地记录。

## License

本项目使用 [MIT 许可证](LICENSE)。
