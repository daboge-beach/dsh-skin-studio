/**
 * ESLint 10 flat config — 仓库唯一 lint 配置（根 + packages/*）。
 *
 * 目标是「能跑起来的质量门禁」而非全量严格化：recommended 规则集 + 对
 * 现存代码基线的合理放宽（warn 不挡提交），后续版本逐步收紧为 error。
 * 不启用 type-aware 规则（无需 tsconfig project 服务，CI 秒级完成）。
 */
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nodeGlobals from 'globals'

export default tseslint.config(
  // 构建产物 / 依赖 / 生成物不检查
  {
    ignores: [
      '**/node_modules/**',
      '**/lib/**',
      '**/dist/**',
      '**/dist-demo/**',
      '**/coverage/**',
      '**/*.d.ts',
      'scripts/vendor/**',
      '.dsh-build/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // 基线放宽：现存代码有历史存量，先 warn 后收紧
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }], // catch 静默是本仓库防御式风格（服务未就绪降级）
    },
  },
  {
    // Node 侧脚本（.mjs）走 JS recommended + Node 全局
    files: ['**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: { globals: nodeGlobals.node },
  },
)
