# AGENTS.md

本文件记录 AIGC Minutes 的开发约定，供人类开发者与 AI 助手共同遵守。修改项目约定或完成重要阶段后，请同步更新本文件。

## 1. 项目定位与范围

AIGC Minutes 是一个 AI 会议纪要工具：输入会议原文（粘贴文本或 TXT/DOCX），生成结构化纪要，支持编辑、复制、导出 Word。

第一版**只做**：

- 工作台输入（文本 / 单文件 TXT、DOCX）
- 纪要生成（摘要、决策、待办）
- 结果编辑、复制、Word 导出
- 可选的 localStorage 本地记录（最多 10 条）

第一版**不做**：登录注册、数据库、Redis/消息队列/微服务、多人协作、权限系统、RAG/向量库、长文档分块、管理后台、PDF/OCR、流式输出、多文件批量。

遇到与上述范围冲突的需求，先提出并说明取舍，不擅自扩大范围。

## 2. 技术栈与目录

- 前端：Vue 3 + TypeScript + Vite + Vue Router + Element Plus（按需引入）+ Axios
- 后端：Node.js + Express 4 + TypeScript + Zod + Mammoth + docx
- AI：任意 OpenAI 兼容接口，`server/src/services/ai.ts` 是唯一模型调用出口
- 包管理器：npm（提交 `package-lock.json`）
- API 契约：路由与错误码在 `server/src/routes/minutes.route.ts`，请求/响应结构在 `server/src/schemas/minutes.ts`；前端类型在 `web/src/types/minutes.ts`，两边手工同步。

```
server/src/
  index.ts          启动与优雅退出
  app.ts            Express 装配（便于测试）
  env.ts            环境变量解析与校验
  routes/           HTTP 路由
  middleware/       上传、统一错误处理
  services/         extractText / ai / minutes / minutesCache / exportDocx
  schemas/          Zod 规则（AI 输出与接口共用）
  lib/              错误类型、日志
web/src/
  api/              axios 实例与接口函数
  components/       SiteHeader、SiteFooter、InputPanel、SourcePanel、MinutesPreview、MinutesEditor
  composables/      useMinutesStore、useLocalMinutes
  data/             exampleMeeting（首页示例原文）
  views/            HomeView、WorkspaceView、HistoryView
  styles/           tokens.css、main.css
  router/           三页路由与页面标题
  utils/            formatMinutes、download
docs/design/        UI/UX 设计规范
```

UI 设计规范：`docs/design/ui-ux-spec.md`。颜色、字体、间距等视觉值只从 `web/src/styles/tokens.css` 读取，组件里不写死颜色。

## 3. 常用命令

```powershell
cd server
npm run dev / typecheck / test / build / start

cd web
npm run dev / typecheck / test / build / preview
```

## 4. 环境变量与密钥

- 真实密钥只写在 `server/.env`，该文件已被 `.gitignore` 忽略。
- `.env.example` 只放占位符，不包含任何真实密钥。
- 密钥不经过前端、不写入日志、不返回给客户端。
- 缺少 `LLM_*` 配置时服务仍可启动，但生成接口返回 503；`/api/health` 暴露 `aiConfigured` 供前端提示。

## 5. 前后端类型同步

`web/src/types/minutes.ts` 与 `server/src/schemas/minutes.ts` 是手工同步的：

- 字段名、必填性、长度上限必须一致。
- 修改任一端时，在同一提交中同步另一端，并在提交说明中注明。
- `owner`、`dueDate` 使用空字符串 `""` 表示「未明确」；`dueDate` 只接受 `YYYY-MM-DD`。

## 6. 代码风格与注释

- 严格 TypeScript，不用 `any` 绕过类型；确实需要时写明原因。
- 命名使用完整英文单词；注释解释「为什么」而非「做了什么」。
- 关键业务逻辑（文本提取、AI 结构化、日期归一、Word 导出）必须有简短中文注释。
- 不为未来需求提前抽象；文件数量保持克制。
- 前端不引入 Pinia/Tailwind 等当前不需要的依赖。

## 7. 测试与验证

- 后端：Vitest + Supertest，覆盖 Zod 规则、确定性后处理、文本提取、AI 解析、缓存、三个接口的成功与失败路径。
- 前端：Vitest 覆盖文本格式化、localStorage、请求取消与示例原文。
- 自动化测试不调用真实模型；真实 API 冒烟需手动执行并人工核对。
- **不得仅凭代码看起来正确就宣称验证通过**：必须实际运行 `npm run typecheck`、`npm test`、`npm run build`，失败时如实报告。
- 涉及外部依赖或模型服务时，先说明前置条件（账号、密钥、端点），不假设已有。

## 8. Git 规范

- 使用 `main` 作为稳定分支；需要练习时创建 `feat/xxx` 功能分支后合并。
- 每个可验证的功能阶段提交一次；功能与其测试放在同一提交。
- 提交前执行：
  ```powershell
  git status
  git diff
  git add <具体文件>
  git diff --staged
  ```
- 使用具体文件路径暂存，禁止 `git add .` / `git add -A` 后直接提交。
- 提交信息格式（中文）：
  - `feat: 新增某某功能`
  - `fix: 修复某某问题`
  - `test: 补充某某测试`
  - `docs: 更新某某文档`
  - `chore: 调整某某配置`
- 检查 `git status` 确认没有 `.env`、密钥、`node_modules`、`dist` 进入暂存区。
- 未经明确确认，不执行 `git push`、`git reset --hard`、强推、改写历史、删除分支或配置远程仓库。
- 不覆盖或丢弃用户已有的未提交修改；发现未知改动先询问。

## 9. AGENTS.md 维护时机

- 项目初始化时创建（本次）。
- 接口契约冻结时更新一次。
- 项目收尾时更新命令、目录、状态与验收结果。
- 目录结构、环境变量、提交规范发生变化时同步更新。

## 10. 当前状态

- P0–P12 与三页 UI/UX 升级（D1–D4）已完成，MVP 可在本地运行并支持单进程静态部署。
- 页面路由：`/` 首页、`/workspace` 工作台、`/history` 本地记录；设计规范在 `docs/design/ui-ux-spec.md`。
- 公开仓库：https://github.com/ACheng-06/aigc-minutes（MIT 许可证）。
- 后端 50 个自动化测试、前端 19 个自动化测试通过；双端 typecheck 与 build 通过（最后核对：2026-10-22）。
- Element Plus 已改为按需引入（`unplugin-auto-import` + `unplugin-vue-components`），`web/src/auto-imports.d.ts` 与 `web/src/components.d.ts` 由构建生成并需提交。
- 单进程部署（`WEB_DIST`）实测页面、SPA 路由、健康检查、API 404；三页界面已用浏览器实测渲染与控制台（无 error/warning），但尚未纳入自动化测试。
- 示例体验已实测：进入示例只填入原文，点击生成后才开始；未配置模型时展示内置结果并在结果上方明确标注，改动原文后仍走真实请求。缓存命中与复用提示另行实测。
- 尚未执行真实模型调用：需要项目所有者配置 `server/.env` 后按 README 的「真实模型冒烟」清单手动验证。
- 后续改动请继续遵守本文件的范围、类型同步、测试与 Git 规范。
