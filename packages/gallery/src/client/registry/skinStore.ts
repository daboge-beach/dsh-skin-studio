/**
 * skinStore — 上传皮肤的 IndexedDB 持久化。
 *
 * 存什么：归一化后的 manifest（strip 前缀版）+ zip 内提取的图片字节。
 * 刷新页面后由 SkinRegistry 启动恢复（loadSkins → toSkinEntry 重建
 * object URL），上传中心从「刷新即丢」变成真正的「已安装」。
 *
 * 降级：IndexedDB 不可用（隐私模式 / 测试环境）时退化为 no-op 内存实现，
 * 上传功能照常（会话内有效），控制台提示一次。
 */
import type { UploadedSkinManifest } from './types.ts'

/** 持久化记录（皮肤包 zip 的等价物：manifest + 图片字节数组）。 */
export interface StoredSkin {
  id: string
  /** 安装时间（ms）。 */
  installedAt: number
  manifest: UploadedSkinManifest
  images: Array<{ path: string; bytes: Uint8Array }>
}

const DB_NAME = 'dsh-skin-studio'
const DB_VERSION = 1
const STORE = 'skins'

/** 环境无 IndexedDB / 打开失败时的内存后备（不持久，仅保当次会话）。 */
class MemoryStore {
  #rows = new Map<string, StoredSkin>()
  async save(skin: StoredSkin): Promise<void> { this.#rows.set(skin.id, skin) }
  async loadAll(): Promise<StoredSkin[]> { return [...this.#rows.values()] }
  async delete(id: string): Promise<void> { this.#rows.delete(id) }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => { resolve(req.result) }
    req.onerror = () => { reject(req.error ?? new Error('IndexedDB 打开失败')) }
  })
}

function tx<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => { resolve(request.result) }
    request.onerror = () => { reject(request.error ?? new Error('IndexedDB 读写失败')) }
  })
}

/** 持久化门面：IndexedDB 可用则落库，否则内存降级（构造时探测一次）。 */
export class SkinStore {
  #backend: Promise<IDBDatabase | MemoryStore>

  constructor() {
    this.#backend = (typeof indexedDB === 'undefined'
      ? Promise.reject(new Error('环境无 IndexedDB'))
      : openDb()
    ).catch(e => {
      console.warn(`[skin-studio] IndexedDB 不可用，上传皮肤仅本次会话有效：${e instanceof Error ? e.message : String(e)}`)
      return new MemoryStore()
    })
  }

  /** 保存/覆盖一款已安装皮肤（同 id 覆盖 = 更新安装）。 */
  async save(skin: StoredSkin): Promise<void> {
    const backend = await this.#backend
    if (backend instanceof MemoryStore) { await backend.save(skin); return }
    await tx(backend, 'readwrite', store => store.put(skin) as IDBRequest<IDBValidKey>)
  }

  /** 全量读取（启动恢复用）。 */
  async loadAll(): Promise<StoredSkin[]> {
    const backend = await this.#backend
    if (backend instanceof MemoryStore) return backend.loadAll()
    const rows = await tx<StoredSkin[]>(backend, 'readonly', store => store.getAll() as IDBRequest<StoredSkin[]>)
    // Uint8Array 经结构化克隆往返后可能是普通视图，统一拷回确保类型成立
    return rows.map(row => ({
      ...row,
      images: row.images.map(img => ({ path: img.path, bytes: new Uint8Array(img.bytes) })),
    }))
  }

  /** 删除一款（卸载）。 */
  async delete(id: string): Promise<void> {
    const backend = await this.#backend
    if (backend instanceof MemoryStore) { await backend.delete(id); return }
    await tx(backend, 'readwrite', store => store.delete(id) as unknown as IDBRequest<undefined>)
  }
}

/** 模块级单例。 */
export const skinStore = new SkinStore()
