/**
 * safeMode — 安全模式横幅（?safe-theme=1）。
 *
 * 场景：第三方皮肤让界面不可读时，用户可能连「关闭皮肤」的按钮都找不到。
 * URL 加 ?safe-theme=1 重开即可跳过全部第三方视觉（皮肤恢复 / 特效 /
 * 吉祥物 / 控制条），并显示一个不依赖任何皮肤样式的原生横幅，一键恢复；
 * ?safe-theme=0 显式清除记忆退出。横幅用内联样式（不 import CSS
 * Modules），保证零皮肤依赖可读。
 *
 * 实现注意：恢复按钮用 document 级事件委托（与宿主 React 委托同款路径），
 * 不用按钮直挂监听——部分 webview 环境对直挂监听器不派发合成点击。
 */
import { isSafeMode } from './hostAdapter.ts'

const SAFE_FLAG = 'dsh-skin-studio.safe'

/** 挂载安全模式横幅（body 直挂，内联样式；恢复走 document 委托）。 */
export function mountSafeModeBanner(): () => void {
  if (typeof document === 'undefined' || !isSafeMode()) return () => {}
  const pill = document.createElement('div')
  pill.setAttribute('data-dsh-skin-studio', 'safe-mode-banner')
  pill.style.cssText = [
    'position:fixed', 'right:16px', 'bottom:16px', 'z-index:2147483646',
    'display:flex', 'align-items:center', 'gap:10px',
    'padding:10px 14px', 'border-radius:10px',
    'background:#111827', 'color:#f9fafb', 'border:1px solid #374151',
    'font:13px/1.4 system-ui, sans-serif', 'box-shadow:0 8px 24px rgb(0 0 0 / 35%)',
  ].join(';')
  const text = document.createElement('span')
  text.textContent = '🛡 安全模式：皮肤与特效已停用。点按钮恢复，或在地址栏访问 ?safe-theme=0'
  const restore = document.createElement('button')
  restore.type = 'button'
  restore.setAttribute('data-safe-theme-restore', '')
  restore.textContent = '恢复正常视觉'
  restore.style.cssText = [
    'padding:4px 10px', 'border-radius:6px', 'cursor:pointer',
    'background:#6366f1', 'color:#fff', 'border:0', 'font:inherit',
  ].join(';')
  pill.append(text, restore)
  document.body.append(pill)

  const onClick = (e: MouseEvent): void => {
    const target = e.target instanceof Element ? e.target.closest('[data-safe-theme-restore]') : null
    if (target === null) return
    try { window.sessionStorage.removeItem(SAFE_FLAG) } catch { /* 隐私模式忽略 */ }
    text.textContent = '正在恢复…'
    restore.disabled = true
    document.removeEventListener('click', onClick)
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('safe-theme')
      window.location.href = url.href
    } catch {
      window.location.reload()
    }
  }
  document.addEventListener('click', onClick)
  return () => {
    document.removeEventListener('click', onClick)
    pill.remove()
  }
}
