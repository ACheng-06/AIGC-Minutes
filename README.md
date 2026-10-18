# AIGC Minutes

AIGC Minutes 是一个 AI 会议纪要生成与整理工具：粘贴会议原文或上传 TXT/DOCX 文件，后端调用大语言模型，将内容整理为结构化纪要（会议摘要、关键决策、待办事项），支持在线编辑、复制和导出 Word。

- 前端：Vue 3 + TypeScript + Vite + Vue Router + Element Plus + Axios
- 后端：Node.js + Express + TypeScript + Zod + Mammoth + docx
- AI：任意 OpenAI 兼容接口，通过环境变量配置，API Key 只保存在后端
- 无登录、无数据库、无协作，适合本地运行和小规模部署的 MVP

> 当前进度：项目初始化阶段。功能与接口按下述规划逐步实现，未完成项会在本文档与提交历史中体现。

## 功能范围（MVP）

1. 工作台：粘贴文本，或上传 `.txt` / `.docx`（单文件，≤ 5MB）。
2. 生成结构化纪要：摘要、关键决策、待办事项（任务 / 负责人 / 截止日期）。
3. 编辑纪要内容；缺失信息显示「未明确」，不编造。
4. 复制为纯文本、导出 `.docx`。
5. 可选：最近 10 条纪要保存在浏览器 localStorage，可载入、删除、清空。

明确不做：注册登录、数据库、Redis/消息队列/微服务、多人协作、权限系统、RAG/向量库、长文档分块、管理后台、PDF/OCR、流式输出。

## 目录结构

```
AIGC Minutes/
├── server/            # Express + TypeScript 后端
│   └── src/
│       ├── routes/        # 接口路由
│       ├── services/      # 文本提取、AI 调用、纪要编排、Word 导出
│       ├── schemas/       # Zod 校验规则（接口与 AI 输出共用）
│       ├── middleware/    # 上传与错误处理
│       └── lib/           # 错误类型与日志
├── web/               # Vue 3 + Vite 前端
│   └── src/
│       ├── views/         # 工作台、本地记录
│       ├── components/    # 输入面板、纪要编辑器
│       ├── composables/   # 当前纪要状态、localStorage
│       ├── api/           # axios 封装
│       └── utils/         # 文本格式化、下载
├── AGENTS.md          # 开发约定与协作规范
└── README.md
```

## 环境要求

- Node.js ≥ 20.19（建议 20 LTS 或 22 LTS）
- npm ≥ 10
- 任意 OpenAI 兼容的大模型接口：DeepSeek、OpenAI、通义千问兼容模式、本地 Ollama 等

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
LLM_BASE_URL=https://api.deepseek.com/v1   # 换成你的服务商地址
LLM_API_KEY=你的密钥                        # 只放在后端，不要提交
LLM_MODEL=deepseek-chat
```

> 没有 API Key 时服务仍可启动，`GET /api/health` 会返回 `aiConfigured: false`，生成接口返回 503 并给出提示。
> 本地 Ollama 示例：`LLM_BASE_URL=http://localhost:11434/v1`、`LLM_API_KEY=ollama`、`LLM_MODEL=qwen2.5:7b`。

### 3. 启动开发环境（两个终端）

```powershell
# 终端 1：后端 http://localhost:3000
cd server
npm run dev

# 终端 2：前端 http://localhost:5173
cd web
npm run dev
```

Vite 已将 `/api` 代理到 `http://localhost:3000`，前端不需要配置跨域。

### 4. 验证

打开浏览器访问 `http://localhost:5173`，粘贴一段会议文本或上传文件，点击「生成纪要」。

也可以直接检查后端：

```powershell
curl.exe http://localhost:3000/api/health
```

## 环境变量

后端 `server/.env`：

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3000` | 后端端口 |
| `NODE_ENV` | 否 | `development` | 运行环境 |
| `LLM_BASE_URL` | 是 | 无 | OpenAI 兼容接口根地址（不含 `/chat/completions`） |
| `LLM_API_KEY` | 是 | 无 | 模型密钥，仅后端可见 |
| `LLM_MODEL` | 是 | 无 | 模型名称 |
| `LLM_TIMEOUT_MS` | 否 | `60000` | 模型调用超时 |
| `MAX_TEXT_CHARS` | 否 | `30000` | 单次生成允许的最大字符数 |
| `MAX_FILE_SIZE_MB` | 否 | `5` | 上传文件大小上限 |
| `WEB_DIST` | 否 | 无 | 可选：前端构建产物目录，用于单进程部署 |

前端 `web/.env`（可选）：`VITE_API_BASE_URL`，留空时使用 `/api` 走 Vite 代理。

## 常用命令

```powershell
# 后端
cd server
npm run dev        # 开发（tsx watch）
npm run typecheck  # 类型检查
npm test           # Vitest + Supertest
npm run build      # 编译到 dist
npm start          # 运行编译产物

# 前端
cd web
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

## 接口摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查，返回服务状态与 AI 是否已配置 |
| POST | `/api/minutes/generate` | 生成纪要；JSON 传 `text`，或 multipart 传 `file` |
| POST | `/api/minutes/export` | 将编辑后的纪要导出为 `.docx` |

成功响应统一为 `{ "data": ... }`，失败为 `{ "error": { "code", "message", "details"? } }`。

## 测试与验证

- 自动化测试不调用真实模型，使用 mock 的 `fetch` / AI 服务。
- 真实模型冒烟测试需要你自行配置 `.env`，并在测试后人工核对生成内容。
- 任何「测试通过 / 构建成功」的结论都应以实际命令输出为准，不以代码看起来正确代替运行。

## 部署

- 方案 A：前端 `npm run build` 得到 `web/dist`，用 Nginx 或静态托管；`/api` 反向代理到 Node 后端。
- 方案 B（可选）：把 `web/dist` 放到后端可访问位置，设置 `WEB_DIST`，由 Express 同时提供静态页面与接口。

安全提示：本项目没有登录与鉴权，请勿在公网公开部署并携带你的真实 API Key；如需公网使用，请先自行增加访问控制。

## 隐私说明

- API Key 只通过后端环境变量读取，不会返回给前端。
- 会议原文会发送给你配置的模型服务商，请遵守其数据政策。
- localStorage 中保存的纪要仅存在于当前浏览器，共用电脑时请及时清空。

## Git 规范

- 稳定分支 `main`；需要练习时创建功能分支后合并。
- 每个可验证的功能阶段提交一次，提交前运行 `git status`、`git diff`、`git diff --staged`。
- 提交信息统一使用中文，前缀为 `feat:` / `fix:` / `test:` / `docs:` / `chore:`。
- 不提交 `.env`、密钥、`node_modules`、构建产物；不使用 `git add .` 直接提交。

详细约定见 [AGENTS.md](AGENTS.md)。
