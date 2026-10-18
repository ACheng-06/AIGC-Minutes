# AIGC Minutes

AIGC Minutes 是一个 AI 会议纪要生成与整理工具：粘贴会议原文或上传 TXT/DOCX 文件，后端提取文本并调用大语言模型，整理为结构化纪要（会议摘要、关键决策、待办事项），支持在线编辑、复制和导出 Word。

> 当前状态：MVP 已完成。后端 47 个自动化测试、前端 13 个自动化测试通过，双端构建成功；真实模型调用需要你自行配置 API Key 后验证。

## 功能

- [x] 工作台：粘贴文本，或上传单个 `.txt` / `.docx`（≤ 5MB）
- [x] 调用任意 OpenAI 兼容接口生成结构化纪要
- [x] 编辑标题、摘要、关键决策、待办（任务 / 负责人 / 截止日期）
- [x] 缺失的负责人或日期显示「未明确」，不编造
- [x] 一键复制为纯文本
- [x] 导出 `.docx`（服务端生成，版式统一）
- [x] 最近 10 条纪要保存到 localStorage，可载入、删除、清空
- [x] 统一错误处理：输入校验、文件类型/大小、AI 异常、超时
- [x] 可选单进程部署（后端同时托管前端构建产物）

明确不做：登录注册、数据库、Redis/消息队列/微服务、多人协作、权限系统、RAG/向量库、长文档分块、管理后台、PDF/OCR、流式输出。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Vue Router、Element Plus、Axios |
| 后端 | Node.js、Express 4、TypeScript、Zod、Mammoth、docx |
| AI | 任意 OpenAI 兼容接口，通过环境变量配置 |
| 测试 | Vitest、Supertest、@vue/test-utils（jsdom） |
| 包管理 | npm（提交 `package-lock.json`） |

## 目录结构

```
AIGC Minutes/
├── server/
│   ├── .env.example          # 后端环境变量模板（无真实密钥）
│   ├── src/
│   │   ├── app.ts            # Express 装配（便于 supertest）
│   │   ├── index.ts          # 启动与优雅退出
│   │   ├── env.ts            # 环境变量解析与校验
│   │   ├── routes/           # /api/minutes 路由
│   │   ├── middleware/       # 上传、统一错误处理
│   │   ├── services/         # 文本提取、AI 调用、编排、Word 导出
│   │   ├── schemas/          # Zod 规则（AI 输出与接口共用）
│   │   └── lib/              # AppError、日志
│   └── tests/                # 47 个后端测试
├── web/
│   ├── .env.example          # 前端环境变量模板
│   └── src/
│       ├── api/              # axios 实例与接口函数
│       ├── components/       # InputPanel、MinutesEditor
│       ├── composables/      # 当前纪要状态、localStorage 历史
│       ├── views/            # 工作台、本地记录
│       ├── utils/            # 复制、文本格式化、下载、文件名
│       ├── types/            # 与后端手工同步的类型
│       └── constants.ts      # 输入限制与存储 key
├── AGENTS.md                 # 开发约定与 Git 规范
└── README.md
```

## 环境要求与模型准备

- Node.js ≥ 20.19（建议 Node 22 LTS；本项目在 Node 20.19.5 验证）
- npm ≥ 10
- 一个支持 `POST {BASE_URL}/chat/completions` 的 OpenAI 兼容服务

**你需要自己准备 API Key，项目不会替你申请，也不会内置任何密钥。**

常见配置示例（以服务商当期文档为准）：

| 服务 | `LLM_BASE_URL` | `LLM_MODEL` 示例 |
| --- | --- | --- |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| 本地 Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` |

Ollama 可把 `LLM_API_KEY` 填成任意占位值（例如 `ollama`），本服务要求三项配置齐全才视为可用。

## 快速开始

### 1. 安装依赖

```powershell
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

> 没有 Key 时服务仍可启动：`/api/health` 会返回 `aiConfigured: false`，生成接口返回 `503 AI_NOT_CONFIGURED`，前端顶部会显示提示。

### 3. 启动开发环境（两个终端）

```powershell
# 终端 1：后端 http://localhost:3000
cd server
npm run dev

# 终端 2：前端 http://localhost:5173
cd web
npm run dev
```

Vite 已把 `/api` 代理到 `http://localhost:3000`，开发时无需处理跨域。

### 4. 验证

```powershell
curl.exe http://localhost:3000/api/health
```

浏览器打开 `http://localhost:5173`，粘贴会议文本或上传文件，点击「生成纪要」。

## 环境变量

`server/.env`：

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3000` | 后端端口 |
| `NODE_ENV` | 否 | `development` | `development` / `test` / `production` |
| `LLM_BASE_URL` | 是 | 无 | OpenAI 兼容接口根地址（不含 `/chat/completions`） |
| `LLM_API_KEY` | 是 | 无 | 模型密钥，仅后端读取，不返回前端 |
| `LLM_MODEL` | 是 | 无 | 模型名称 |
| `LLM_TIMEOUT_MS` | 否 | `60000` | 模型调用超时（毫秒） |
| `MAX_TEXT_CHARS` | 否 | `30000` | 单次生成允许的最大字符数 |
| `MAX_FILE_SIZE_MB` | 否 | `5` | 上传文件大小上限 |
| `WEB_DIST` | 否 | 无 | 前端构建产物目录，用于单进程部署 |

`web/.env`（可选）：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 留空时使用 `/api` + Vite 代理；前后端不同域时填写完整地址 |

前端 `web/src/constants.ts` 中的输入限制与后端默认值保持一致，修改时请同步。

## 接口

成功响应统一为 `{ "data": ... }`，失败统一为：

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "请求参数不合法", "details": [{ "path": "text", "message": "文本不能为空" }] } }
```

### `GET /api/health`

```json
{ "data": { "status": "ok", "aiConfigured": true, "timestamp": "2026-10-18T08:00:00.000Z" } }
```

`aiConfigured` 只检查三项 LLM 环境变量是否齐全，不真实调用模型。

### `POST /api/minutes/generate`

两种请求方式，按 `Content-Type` 区分：

**JSON**

```json
{ "text": "会议原文……" }
```

**multipart/form-data**

字段 `file`，单个 `.txt` / `.docx`，≤ 5MB。

**成功响应**

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
      "generatedAt": "2026-10-18T08:00:00.000Z"
    }
  }
}
```

`owner` / `dueDate` 为空字符串表示未明确；`dueDate` 只接受 `YYYY-MM-DD`，其他写法会被归一为空。

### `POST /api/minutes/export`

```json
{ "minutes": { "title": "……", "summary": "……", "decisions": ["……"], "todos": [] } }
```

成功返回 `application/vnd.openxmlformats-officedocument.wordprocessingml.document` 二进制，并带下载文件名。请求体上限 1MB，摘要必填，决策最多 20 条，待办最多 20 条。

### 错误码

| code | HTTP | 场景 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 字段/JSON/Zod 校验失败 |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | 既不是 JSON 也不是 multipart |
| `UNSUPPORTED_FILE_TYPE` | 415 | 非 TXT/DOCX、旧版 `.doc`、伪造 DOCX |
| `FILE_TOO_LARGE` | 413 | 文件超过大小限制 |
| `PAYLOAD_TOO_LARGE` | 413 | 请求体超过 1MB |
| `CONTENT_TOO_LONG` | 422 | 提取文本超过字符上限 |
| `FILE_PARSE_ERROR` | 422 | DOCX 损坏或文本解码失败 |
| `EMPTY_CONTENT` | 422 | 没有有效文本 |
| `AI_NOT_CONFIGURED` | 503 | 缺少 LLM 配置 |
| `AI_TIMEOUT` | 504 | 模型响应超时 |
| `AI_UPSTREAM_ERROR` | 502 | 模型服务非 2xx/网络异常/空响应 |
| `AI_INVALID_OUTPUT` | 502 | 结构化校验两次仍失败 |
| `EXPORT_ERROR` | 500 | Word 生成失败 |
| `NOT_FOUND` | 404 | 未知路由 |
| `INTERNAL_ERROR` | 500 | 未预期异常 |

## 常用命令

```powershell
# 后端
cd server
npm run dev        # tsx watch
npm run typecheck  # tsc --noEmit
npm test           # Vitest + Supertest
npm run build      # 编译到 dist
npm start          # 运行 dist

# 前端
cd web
npm run dev
npm run typecheck  # vue-tsc --noEmit
npm test
npm run build
npm run preview
```

## 测试与验证

自动化测试不调用真实模型：API 测试中 mock 了 AI 服务，AI 测试中 mock 了 `fetch`。

**最近一次实际验证（2026-10-18）：**

- 后端 `typecheck`、`build` 通过；`npm test` 共 **5 个文件 / 47 个用例**通过。
- 前端 `typecheck`、`build` 通过；`npm test` 共 **3 个文件 / 13 个用例**通过。
- 单进程部署实测：`/`、`/history` 返回页面，`/api/health` 正常，未知 `/api` 路径返回 JSON 404。

覆盖范围：Zod 归一化、TXT/DOCX 提取（含 GBK、损坏文件）、AI JSON 解析与一次修复、超时/上游异常、输入校验、文件大小、导出 docx、localStorage 上限与配额异常。

**真实模型冒烟（需要你的 Key，未在本机执行）：**

1. 配置 `server/.env` 后启动前后端。
2. 粘贴一段会议文本生成纪要，确认摘要/决策/待办合理。
3. 上传真实 DOCX，确认中文提取正常。
4. 修改内容后复制、导出 Word，用 Word/WPS 打开确认版式。
5. 故意填错 Key 或断网，确认页面显示可理解的错误。

> 项目中任何「测试通过 / 构建成功」的结论都以实际命令输出为准。

## 部署

### 方案 A：前后端分离

1. `web` 执行 `npm run build`，把 `web/dist` 交给 Nginx 或静态托管。
2. `/api` 反向代理到 Node 后端。
3. 后端只配置环境变量（不要提交 `.env`）。

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

安全提示：项目没有登录/鉴权，请勿在公网公开部署并携带真实 Key；如需公网使用，请先增加访问控制。

## 已知限制

- Element Plus 采用全量引入，构建产物约 1.1MB（gzip 约 360KB）；MVP 优先可读性，后续可改按需引入。
- 不做流式输出，生成期间需要等待 10–60 秒。
- 不做长文档分块，输入上限 30000 字符；超出会明确报错，不会静默截断。
- localStorage 最多 10 条，共用电脑时请及时清空。
- 未实现自动重试、限流、鉴权；AI 调用失败由用户手动重试。

## Git 工作流

```powershell
git status
git diff
git add <具体文件>
git diff --staged
git commit -m "feat: 说明本次改动"
```

- 稳定分支 `main`，功能阶段提交一次，功能与测试放在同一提交。
- 提交信息使用中文，前缀 `feat:` / `fix:` / `test:` / `docs:` / `chore:`。
- 不使用 `git add .` 直接提交；不提交 `.env`、密钥、`node_modules`、`dist`。
- 未经确认不执行 `git push`、强推、改写历史或删除分支。

详细约定见 [AGENTS.md](AGENTS.md)。

## 隐私说明

- API Key 只通过后端环境变量读取，不返回前端、不写入日志。
- 会议原文会发送给你配置的模型服务商，请遵守其数据政策。
- 本地记录只存在当前浏览器，不会上传服务器。
