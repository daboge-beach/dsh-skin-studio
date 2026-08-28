# 贡献指南

感谢你对 DSH Skin Studio 的兴趣！本文档说明如何贡献皮肤、代码、文档或问题反馈。

---

## 🎨 贡献皮肤（最常见）

任何人都可以贡献皮肤到内置画廊。流程：

### 1. 准备皮肤

```bash
npx @dsh-skin-studio/create my-awesome-skin
cd my-awesome-skin
# 开发、调试、构建（详见 docs/DEVELOPMENT.md）
pnpm build
pnpm validate
```

### 2. 质量要求

提交前请确认你的皮肤满足以下要求：

- [ ] `skin.json` 字段完整且通过校验
- [ ] 提供 `preview.png`（1280×800）预览图
- [ ] `present()` 返回的清理函数能彻底回滚（试穿退出无残留）
- [ ] 同时测试亮色和暗色变体（如果声明了）
- [ ] 不依赖未声明的插件（`capabilities.consumePlugins` 要写全）
- [ ] 不调用 `eval`、不动态注入 `<script>`、不做跨域请求
- [ ] 预览图和资源**自有版权**或采用 CC0 / MIT / Apache 等开放协议

### 3. 提交 PR

1. Fork 本仓库
2. 新建分支：`git checkout -b skin/my-awesome-skin`
3. 把皮肤源码放到 `packages/skins/my-awesome-skin/`
4. 在 `packages/skins/my-awesome-skin/README.md` 写清楚皮肤介绍和截图
5. 提交 PR，标题：`[skin] add my-awesome-skin`
6. PR 描述里附上 3–5 张不同界面的截图（对话页、设置页、暗色变体等）

### 4. 评审标准

评审人会检查：

- **视觉品质**：色彩协调、对比度符合 WCAG AA（4.5:1）
- **回滚干净**：试穿→退出后 UI 完全恢复
- **性能**：无明显卡顿（动画建议用 CSS transform / opacity）
- **降级正确**：依赖的插件未安装时不崩溃
- **无安全风险**：无外链脚本、无可疑网络请求

通过后合入 `main`，随下一版 `@dsh-skin-studio/gallery` 发布。

## 💻 贡献代码

### 开发环境

```bash
git clone https://github.com/daboge-beach/dsh-skin-studio.git
cd dsh-skin-studio
pnpm install
pnpm build
pnpm test
```

### 分支约定

| 分支前缀 | 用途 |
|---|---|
| `skin/` | 新增或修改皮肤 |
| `feat/` | 新功能 |
| `fix/` | bug 修复 |
| `docs/` | 文档改进 |
| `chore/` | 构建、CI、依赖等杂项 |
| `refactor/` | 重构（不改行为） |

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

<body>

<footer>
```

示例：

```
feat(gallery): 支持拖拽上传 zip 皮肤包

- 自动解压并校验 skin.json
- 校验失败时显示具体错误
- 支持 nested 目录结构

Closes #42
```

### 测试

- 皮肤相关的逻辑：`pnpm test`
- 皮肤端到端测试：`pnpm test:e2e`
- 提交前跑 `pnpm lint` 和 `pnpm validate-skins`

### 新增皮肤

- 一条命令出骨架：`pnpm gen:skin -- <id> --name "中文名"`，完整流程见
  [皮肤创作指南](skin-authoring.md)
- 之后 `pnpm gen:skin-data` 自动进画廊注册表，`pnpm validate-skins` 过门禁
- 修改皮肤 tokens / 元信息后同样重跑 `pnpm gen:skin-data`（CI 有漂移检查）

## 📝 贡献文档

- 修正错别字、补充说明：直接 PR
- 新增指南文章：放到 `docs/` 下，文件名用 `UPPER_SNAKE_CASE.md`
- 翻译：在 `docs/i18n/<lang>/` 下对应文件

## 🐛 反馈问题

### 报告 Bug

[开一个 Issue](https://github.com/daboge-beach/dsh-skin-studio/issues/new?labels=bug)，请包含：

- DSH 版本（`dsh --version`）
- Skin Studio 版本
- 操作系统 + 浏览器
- 复现步骤
- 期望行为 vs 实际行为
- 浏览器控制台错误截图

### 提建议

[开一个 Discussion](https://github.com/daboge-beach/dsh-skin-studio/discussions)，描述你想要的皮肤或功能。

## 📜 行为准则

- 友善、尊重、就事论事
- 不接受抄袭皮肤（copy 别人的 `client.js` 改个名）
- 不接受含恶意代码、外链追踪、挖矿脚本的皮肤
- 贡献内容遵循 MIT 协议

## 📄 License

提交的贡献默认遵循项目的 [MIT License](../LICENSE)。
