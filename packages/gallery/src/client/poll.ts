/**
 * poll — 统一轮询调度器。
 *
 * ComposerDock 的模型文案镜像 / efforts 列表 / tierPower 的推理等级
 * 原本各自独立 setInterval，合并为一个 1s tick + 回调分发（性能：
 * 3 个 timer → 1 个，避免多个独立事件循环源）。
 */
type PollCallback = () => void
const callbacks = new Set<PollCallback>()
let timer: number | undefined

function tick(): void {
  for (const cb of callbacks) {
    try { cb() } catch { /* 单个回调失败不影响其他 */ }
  }
}

/** 注册轮询回调（返回取消函数）。 */
export function pollEvery(callback: PollCallback, _intervalMs?: number): () => void {
  callbacks.add(callback)
  if (timer === undefined) {
    timer = window.setInterval(tick, 1000)
  }
  // 注册时立即执行一次
  try { callback() } catch { /* ignore */ }
  return () => {
    callbacks.delete(callback)
    if (callbacks.size === 0 && timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }
}
