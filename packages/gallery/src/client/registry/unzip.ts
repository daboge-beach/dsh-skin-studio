/**
 * 零依赖 zip 解压（浏览器 / Node 通用）。
 *
 * 解析 zip 中央目录 + 本地文件头，支持 STORE（method 0）与 DEFLATE
 * （method 8，走原生 DecompressionStream('deflate-raw')，Node ≥ 22 /
 * Chromium ≥ 103 / Safari ≥ 16.4）。皮肤包是纯静态资源（PNG + JSON），
 * 不需要加密 / zip64 / 跨盘等冷门特性，遇到即给出可读错误。
 */

interface CentralDirEntry {
  name: string
  method: number
  compressedSize: number
  uncompressedSize: number
  localHeaderOffset: number
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

function readCentralDirectory(bytes: Uint8Array): CentralDirEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEocd(bytes)
  const entryCount = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)

  const entries: CentralDirEntry[] = []
  const decoder = new TextDecoder()
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
    if (!name.endsWith('/')) {
      entries.push({ name, method, compressedSize, uncompressedSize, localHeaderOffset })
    }
    offset += 46 + nameLength + extraLength + commentLength
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
 * 解压 zip 到「路径 → 字节」映射。
 *
 * @param bytes - zip 文件的原始字节（File.arrayBuffer() 的结果）。
 * @returns 所有非目录条目。目录条目（名字以 / 结尾）被跳过。
 */
export async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const entries = readCentralDirectory(bytes)
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
