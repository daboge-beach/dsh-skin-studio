/**
 * readme-commands.test.ts — README 安装命令防失效门禁。
 *
 * 扫描 README.md / README.zh-CN.md 的 Quick Start / 安装代码块，逐条校验：
 *  - pnpm <script>       → 必须存在于根 package.json scripts
 *  - node scripts/x.mjs  → 文件必须存在
 *  - git clone           → 必须是本仓库真实地址
 *  - npx <pkg> / npm install <pkg> / dsh plugin add <pkg>
 *                       → 只允许出现在「未发布占位」注释块中且带 TODO(npm-publish)
 * 这防止 README 再次宣传不存在的 npm 包或 CLI（v0.16 审计发现的历史问题）。
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const READMES = ['README.md', 'README.zh-CN.md']
  .map(f => ({ f, content: readFileSync(resolve(REPO, f), 'utf8') }))
  .filter(({ content }) => content.length > 0)

/** 提取 bash 代码块里的可执行行（去注释/空行）。 */
function commandLines(md: string): string[] {
  const out: string[] = []
  let inBash = false
  for (const line of md.split('\n')) {
    if (line.trim().startsWith('```')) { inBash = !inBash && /```(bash|sh|shell)?/i.test(line.trim()); continue }
    if (!inBash) continue
    const t = line.trim()
    if (t === '' || t.startsWith('#') || t.startsWith('//')) continue
    out.push(t)
  }
  return out
}

const rootScripts = Object.keys(JSON.parse(readFileSync(resolve(REPO, 'package.json'), 'utf8')).scripts ?? {})

describe('README 安装命令真实性（获客门禁）', () => {
  it('两个 README 都存在且含 Quick Start', () => {
    expect(READMES.length).toBe(2)
    for (const { f, content } of READMES) {
      expect(content, f).toMatch(/Quick Start|快速开始/)
    }
  })

  it('pnpm 命令必须对应真实 script', () => {
    for (const { f, content } of READMES) {
      for (const cmd of commandLines(content)) {
        const m = /^pnpm (?:-w )?([a-z][\w:-]*)/.exec(cmd)
        if (m === null) continue
        // pnpm install / pnpm build 等内建命令放行；自定义 script 必须存在
        const builtin = new Set(['install', 'add', 'build', 'dev', 'test', 'run', 'why', 'up'])
        if (builtin.has(m[1] ?? '')) continue
        expect(rootScripts, `${f}: ${cmd}`).toContain(m[1])
      }
    }
  })

  it('node scripts/ 命令的文件必须存在', () => {
    for (const { f, content } of READMES) {
      for (const cmd of commandLines(content)) {
        const m = /^node (--\w[\w-]*(?:\s+\S+)?\s+)?(scripts\/[\w./-]+\.mjs)/.exec(cmd)
        if (m === null) continue
        expect(existsSync(resolve(REPO, m[2] ?? '')), `${f}: ${cmd}`).toBe(true)
      }
    }
  })

  it('git clone 必须指向本仓库', () => {
    for (const { f, content } of READMES) {
      for (const cmd of commandLines(content)) {
        if (!cmd.startsWith('git clone')) continue
        expect(cmd, f).toContain('daboge-beach/dsh-skin-studio')
      }
    }
  })

  it('不得出现未发布的 npm 包命令（npx/@scope 安装/dsh plugin add）——除非带 TODO(npm-publish) 标记行', () => {
    for (const { f, content } of READMES) {
      // 按代码块切分，检查每个块
      const blocks = content.split(/```/).filter((_, i) => i % 2 === 1)
      for (const block of blocks) {
        const flagged = block.includes('TODO(npm-publish)')
        for (const line of block.split('\n')) {
          const t = line.trim()
          const isNpmish = /^npx\s+@?[\w/.-]+\s/.test(t)
            || /^npm (i|install)\s+@?[\w/.-]+/.test(t)
            || /^dsh plugin\s+.*add\s+[\w/.@-]+/.test(t)
          if (!isNpmish || flagged) continue
          // 白名单：官方 DSH 自身命令（非本项目的包）
          expect.fail(`${f}: 未验证的安装命令「${t}」——若为占位请将整块标注 TODO(npm-publish)，否则删除`)
        }
      }
    }
  })
})
