/**
 * zipWriter — 零依赖 zip 打包（STORE，不压缩）。
 *
 * 用途：把已安装皮肤的 manifest + 图片导出回 .zip（上传的逆操作），
 * 供备份 / 分享 / 重新安装。图片本身已是压缩格式（PNG/JPEG），STORE
 * 不损失体积优势；CRC32 用查表法。
 */

/** CRC32 查表（多项式 0xEDB88320）。 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    c = (CRC_TABLE[(c ^ (bytes[i] ?? 0)) & 0xff] ?? 0) ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/** 打包行：名字字节 / 数据 / CRC / 本地头偏移（一趟累计）。 */
interface Row {
  name: Uint8Array
  bytes: Uint8Array
  crc: number
  localOffset: number
}

function writeU16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true) }
function writeU32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value, true) }

/**
 * 打包 zip（STORE）。条目名用 UTF-8（general purpose bit 11 置位）。
 * @returns zip 文件的字节。
 */
export function zipStore(entries: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  const encoder = new TextEncoder()

  // 行数据 + 本地头偏移（30 + 名字 + 数据 逐项累计）
  const rows: Row[] = []
  let cursor = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    rows.push({ name, bytes: entry.bytes, crc: crc32(entry.bytes), localOffset: cursor })
    cursor += 30 + name.length + entry.bytes.length
  }
  const centralStart = cursor
  const centralSize = rows.reduce((n, r) => n + 46 + r.name.length, 0)
  const total = centralStart + centralSize + 22

  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  // 本地文件头 + 数据
  let offset = 0
  for (const r of rows) {
    writeU32(view, offset, 0x04034b50) // 本地文件头签名
    writeU16(view, offset + 4, 20) // 版本（2.0）
    writeU16(view, offset + 6, 0x0800) // UTF-8 名字
    writeU16(view, offset + 8, 0) // STORE
    writeU16(view, offset + 10, 0) // 时间
    writeU16(view, offset + 12, 0x2100) // 日期（2000-01-01 基准）
    writeU32(view, offset + 14, r.crc)
    writeU32(view, offset + 18, r.bytes.length) // 压缩后
    writeU32(view, offset + 22, r.bytes.length) // 解压后
    writeU16(view, offset + 26, r.name.length)
    writeU16(view, offset + 28, 0) // extra 长度
    out.set(r.name, offset + 30)
    out.set(r.bytes, offset + 30 + r.name.length)
    offset += 30 + r.name.length + r.bytes.length
  }

  // 中央目录
  for (const r of rows) {
    writeU32(view, offset, 0x02014b50) // 中央目录签名
    writeU16(view, offset + 4, 20) // 制作版本
    writeU16(view, offset + 6, 20) // 需要版本
    writeU16(view, offset + 8, 0x0800) // UTF-8
    writeU16(view, offset + 10, 0) // STORE
    writeU16(view, offset + 12, 0) // 时间
    writeU16(view, offset + 14, 0x2100) // 日期
    writeU32(view, offset + 16, r.crc)
    writeU32(view, offset + 20, r.bytes.length)
    writeU32(view, offset + 24, r.bytes.length)
    writeU16(view, offset + 28, r.name.length)
    writeU16(view, offset + 30, 0) // extra
    writeU16(view, offset + 32, 0) // comment
    writeU16(view, offset + 34, 0) // 盘号
    writeU16(view, offset + 36, 0) // 内部属性
    writeU32(view, offset + 38, 0) // 外部属性
    writeU32(view, offset + 42, r.localOffset)
    out.set(r.name, offset + 46)
    offset += 46 + r.name.length
  }

  // EOCD
  writeU32(view, offset, 0x06054b50)
  writeU16(view, offset + 4, 0)
  writeU16(view, offset + 6, 0)
  writeU16(view, offset + 8, rows.length)
  writeU16(view, offset + 10, rows.length)
  writeU32(view, offset + 12, centralSize)
  writeU32(view, offset + 16, centralStart)
  writeU16(view, offset + 20, 0) // comment 长度
  return out
}
