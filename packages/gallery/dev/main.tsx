/**
 * demo 宿主壳（pnpm dev）。
 *
 * 模拟 DSH Web 端布局：左侧栏（Skin Studio 入口）+ 主区域（画廊面板）。
 * 主题注册由插件的浏览器半边自己完成（apply → ctx.theme.register × 7，
 * 与真实 DSH 一致）；mock 宿主不再预注册。
 */
import { useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { apply as applyGallery } from '../src/client/index.ts'
import { createMockHost } from './mockHost.ts'
import './shell.css'

const host = createMockHost([])

// 载入皮肤中心插件（与真实 DSH 的插件加载等价：import + apply(ctx)）
applyGallery(host.ctx)

function DemoShell(): JSX.Element {
  const entries = useSyncExternalStore(host.subscribeEntries, host.sidebarEntries)
  const active = entries.find(e => e.id === 'skin-studio') ?? entries[0]

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <div className="demo-brand">DSH <span>demo host</span></div>
        {entries.map(entry => (
          <button key={entry.id} type="button" className="demo-nav">
            {entry.icon}
            <span>{entry.title}</span>
          </button>
        ))}
        <div className="demo-note">
          mock ClientContext — 官方 ctx.theme 语义的镜像。
          偏好持久化到 localStorage。
        </div>
      </aside>
      <main className="demo-main">
        {active?.panel}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<DemoShell />)
