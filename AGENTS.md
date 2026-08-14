# AGENTS.md

> 给 AI 协作者（如 Claude Code、DeepSeek Harness 自身）的工作指南。

## 项目身份

- **名称**：DSH Skin Studio
- **定位**：DeepSeek Harness 的皮肤工作室 —— 内置精选皮肤 + 用户上传皮肤中心
- **核心差异**：不是"作者精选 N 款"，而是"任何人都能贡献、任何人都能装"的开放 marketplace
- **License**：MIT
- **上游依赖**：[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) v0.1+（开发者预览阶段，API 不稳定）

## 关键命令

```bash
pnpm install           # 安装依赖
pnpm build             # 构建所有包
pnpm dev               # 启动开发模式（热重载）
pnpm test              # 跑测试
pnpm lint              # 代码检查
pnpm typecheck         # 类型检查
pnpm validate-skins    # 校验所有内置皮肤的 skin.json
```

## 架构要点

1. **pnpm workspace monorepo**：`packages/*` 是功能包，`packages/skins/*` 是内置皮肤
2. **皮肤格式**：见 `docs/SKIN_SPEC.md`（权威定义）
3. **皮肤类型**：见 `packages/types/src/index.ts`
4. **皮肤本质**：实现 `ThemePresenter` 接口的 UI 插件，通过 `present()` / `retraction()` 控制生命周期
5. **与 dsh-web-ui 兼容**：已有皮肤可零修改迁移（见规范第 7 节）

## 工作约定

### 改动皮肤时
- 改完跑 `pnpm validate-skins` 确认 manifest 校验通过
- 亮色和暗色变体都要测（如果声明了 `variants: ["light", "dark"]`）
- `present()` 返回的清理函数必须能彻底回滚

### 改规范时
- `docs/SIN_SPEC.md` 是权威，类型定义跟随规范
- 改了字段要同步更新：规范、类型、校验器、示例皮肤、文档
- 规范版本号在 `skin.json` 的 `specVersion` 字段

### 提交前
- `pnpm lint && pnpm typecheck && pnpm test`
- 遵循 Conventional Commits（见 `docs/CONTRIBUTING.md`）

## 不要做的事

- ❌ 不要直接修改 `lib/` 下的构建产物（改源码后重新 build）
- ❌ 不要在皮肤里用 `eval` / `Function` / 动态 `<script>`（CSP 拦截）
- ❌ 不要让皮肤硬依赖某个插件（必须是软依赖，缺失时降级）
- ❌ 不要提交 `node_modules/`、`lib/`、`.env`、token 文件
- ❌ 不要在皮肤里写跨域请求（除非 `capabilities.consumePlugins` 声明）

## 当前进度

详见 `README.md` 的路线图。简言之：
- [x] 仓库初始化、规范定稿、示例皮肤
- [ ] v0.1：画廊 UI MVP、皮肤加载器
- [ ] v0.2：拖拽上传、zip 解压
