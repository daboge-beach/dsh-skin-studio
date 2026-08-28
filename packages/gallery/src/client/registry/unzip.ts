/**
 * 零依赖 zip 解压（浏览器 / Node 通用）。
 *
 * 解析 zip 中央目录 + 本地文件头，支持 STORE（method 0）与 DEFLATE
 * （method 8，走原生 DecompressionStream('deflate-raw')，Node ≥ 22 /
 * Chromium ≥ 103 / Safari ≥ 16.4）。皮肤包是纯静态资源（PNG + JSON），
 * 不需要加密 / zip64 / 跨盘等冷门特性，遇到即给出可读错误。
 *
 * 安全（zip bomb / 路径穿越防护）：解压前按中央目录声明的大小做预检
 * （条目数、单条目与总解压量、压缩比），路径做绝对路径 / `..` / 重复 /
 * 深度检查；解压后再核对实际大小与声明一致。
 */

interface CentralDirEntry {
  name: string
  method: number
  compressedSize: number
  uncompressedSize: number
  localHeaderOffset: number
}

/** 解压安全限制（默认值按「五档全资产皮肤包 ≈ 40MB」的合理余量设定）。 */
export interface ZipLimits {
  /** zip 文件本身的字节上限。 */
  maxArchiveBytes: number
  /** 条目（文件）数量上限。 */
  maxEntries: number
  /** 单条目解压后字节上限。 */
  maxEntryUncompressed: number
  /** 全部条目解压后总量上限。 */
  maxTotalUncompressed: number
  /** 压缩比上限（解压后 / 压缩前；仅对压缩前 >4KB 的条目生效，小文件高比例正常）。 */
  maxCompressionRatio: number
  /** 路径目录深度上限（a/b/c.png = 2）。 */
  maxPathDepth: number
}

/** 默认限制：压缩包 ≤50MB、≤2000 个文件、单文件解压 ≤60MB、总量 ≤240MB、压缩比 ≤100、深度 ≤8。 */
export const DEFAULT_ZIP_LIMITS: ZipLimits = {
  maxArchiveBytes: 50 * 1024 * 1024,
  maxEntries: 2000,
  maxEntryUncompressed: 60 * 1024 * 1024,
  maxTotalUncompressed: 240 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxPathDepth: 8,
}

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const LOCAL_SIGNATURE = 0x04034b50

function safeSlice(bytes: Uint8Array, start: number, end: number): Uint8Array {
  return bytes.slice(start, Math.min(end, bytes.length))
}

/** 从文件尾向回找 End Of Central Directory 记录。 */
function findEocd(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const minOffset = Math.max(0, bytes.length - 22 - 0xffff)
  for (let i = bytes.length - 22; i >= minOffset; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i
  }
    throw new Error('不是有效的 .zip 文件（找不到中央目录结尾记录）')
}

/** 路径安全检查：拒绝绝对路径、`..` 段、盘符与过深嵌套；统一分隔符后判重。 */
function checkEntryName(name: string, limits: ZipLimits, seen: Set<string>): void {
  if (name.includes('\\')) {
    throw new Error(`zip 条目 "${name}" 使用反斜杠路径（不支持）`)
  }
  if (/^[a-zA-Z]:/.test(name) || name.startsWith('/')) {
    throw new Error(`zip 条目 "${name}" 是绝对路径（不支持）`)
  }
  const segments = name.split('/')
  if (segments.some(seg => seg === '..')) {
    throw new Error(`zip 条目 "${name}" 含 ".." 路径穿越段（不支持）`)
  }
  if (segments.length - 1 > limits.maxPathDepth) {
    throw new Error(`zip 条目 "${name}" 目录深度超过 ${limits.maxPathDepth}`)
  }
  const normalized = segments.filter(seg => seg !== '.').join('/')
  if (seen.has(normalized)) {
    throw new Error(`zip 条目 "${name}" 与其他条目路径重复`)
  }
  seen.add(normalized)
}

function readCentralDirectory(bytes: Uint8Array, limits: ZipLimits): CentralDirEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEocd(bytes)
  const entryCount = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)

  if (entryCount > limits.maxEntries) {
    throw new Error(`zip 条目数 ${entryCount} 超过上限 ${limits.maxEntries}`)
  }

  const entries: CentralDirEntry[] = []
  const decoder = new TextDecoder()
  const seen = new Set<string>()
  let totalUncompressed = 0
  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new Error('zip 中央目录损坏')
    }
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const uncompressedSize = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(safeSlice(bytes, offset + 46, offset + 46 + nameLength))
    offset += 46 + nameLength + extraLength + commentLength

    if (name.endsWith('/')) continue // 目录条目跳过（不占安全预算）

    checkEntryName(name, limits, seen)

    // zip bomb 预检：按中央目录声明的大小，解压前拒绝
    if (uncompressedSize > limits.maxEntryUncompressed) {
      throw new Error(`zip 条目 "${name}" 解压后 ${Math.round(uncompressedSize / 1048576)}MB 超过单文件上限 ${Math.round(limits.maxEntryUncompressed / 1048576)}MB`)
    }
    totalUncompressed += uncompressedSize
    if (totalUncompressed > limits.maxTotalUncompressed) {
      throw new Error(`zip 解压后总量超过 ${Math.round(limits.maxTotalUncompressed / 1048576)}MB 上限`)
    }
    // 小文件高压缩比正常（几字节 → 几百字节），只对压缩前 >4KB 的条目查比例
    if (compressedSize > 4096 && method === 8 && uncompressedSize / compressedSize > limits.maxCompressionRatio) {
      throw new Error(`zip 条目 "${name}" 压缩比 ${Math.round(uncompressedSize / compressedSize)}:1 异常（疑似 zip bomb）`)
    }

    entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset })
  }
  return entries
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前环境不支持 DecompressionStream，无法解压 deflate 条目')
  }
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  const out = new Uint8Array(await new Response(stream).arrayBuffer())
  return out
}

/**
 * 解压 zip 到「路径 → 字节」映射（带安全限制）。
 *
 * @param bytes - zip 文件的原始字节（File.arrayBuffer() 的结果；调用方
 *   负责先按 limits.maxArchiveBytes 检查文件本身体积）。
 * @param limits - 安全限制；缺省 DEFAULT_ZIP_LIMITS。
 * @returns 所有非目录条目。目录条目（名字以 / 结尾）被跳过。
 */
export async function unzip(bytes: Uint8Array, limits: ZipLimits = DEFAULT_ZIP_LIMITS): Promise<Map<string, Uint8Array>> {
  if (bytes.length > limits.maxArchiveBytes) {
    throw new Error(`zip 文件 ${Math.round(bytes.length / 1048576)}MB 超过 ${Math.round(limits.maxArchiveBytes / 1048576)}MB 上限`)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const entries = readCentralDirectory(bytes, limits)
  const files = new Map<string, Uint8Array>()

  for (const entry of entries) {
    const header = entry.localHeaderOffset
    if (view.getUint32(header, true) !== LOCAL_SIGNATURE) {
      throw new Error(`zip 条目 "${entry.name}" 的本地文件头损坏`)
    }
    const nameLength = view.getUint16(header + 26, true)
    const extraLength = view.getUint16(header + 28, true)
    const dataStart = header + 30 + nameLength + extraLength
    const raw = safeSlice(bytes, dataStart, dataStart + entry.compressedSize)

    switch (entry.method) {
      case 0: // STORE
        if (raw.length !== entry.uncompressedSize && entry.uncompressedSize !== 0) {
          throw new Error(`zip 条目 "${entry.name}" 大小与中央目录声明不符（可能已损坏）`)
        }
        files.set(entry.name, raw)
        break
      case 8: { // DEFLATE
        const inflated = await inflateRaw(raw)
        if (entry.uncompressedSize !== 0 && inflated.length !== entry.uncompressedSize) {
          throw new Error(`zip 条目 "${entry.name}" 解压后大小不符（可能已损坏）`)
        }
        files.set(entry.name, inflated)
        break
      }
      default:
        throw new Error(`zip 条目 "${entry.name}" 使用不支持的压缩方式（method ${entry.method}）`)
    }
  }
  return files
}

/**
 * 在 zip 条目里按后缀名找第一个匹配（皮肤包内文件可能在包根或子目录下，
 * 如 skin.json、my-skin/skin.json）。
 */
export function findEntry(files: Map<string, Uint8Array>, fileName: string): string | undefined {
  const direct = files.get(fileName)
  if (direct !== undefined) return fileName
  for (const name of files.keys()) {
    if (name.endsWith(`/${fileName}`)) return name
  }
  return undefined
}
