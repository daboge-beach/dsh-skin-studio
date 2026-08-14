/**
 * zip 构造器（测试专用）：产出极简但合法的 zip 字节。
 * CRC 字段写 0 —— unzip.ts 不校验 CRC（浏览器 DecompressionStream 同样不校验）。
 */
import { deflateRawSync } from 'node:zlib'

export interface ZipInput {
  name: string
  data: Uint8Array
  /** 0 = STORE，8 = DEFLATE（默认）。 */
  method?: 0 | 8
}

export function buildZip(files: Array<ZipInput>): Uint8Array {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const method = file.method ?? 8
    const payload = method === 0 ? file.data : new Uint8Array(deflateRawSync(Buffer.from(file.data)))

    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)      // version needed
    lv.setUint16(6, 0, true)       // flags
    lv.setUint16(8, method, true)
    lv.setUint32(14, 0, true)      // crc32（不校验）
    lv.setUint32(18, payload.length, true)
    lv.setUint32(22, file.data.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)      // extra len
    local.set(nameBytes, 30)
    locals.push(local, payload)

    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)      // version made by
    cv.setUint16(6, 20, true)      // version needed
    cv.setUint16(8, 0, true)       // flags
    cv.setUint16(10, method, true)
    cv.setUint32(16, 0, true)      // crc32
    cv.setUint32(20, payload.length, true)
    cv.setUint32(24, file.data.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)      // extra len
    cv.setUint16(32, 0, true)      // comment len
    cv.setUint16(34, 0, true)      // disk start
    cv.setUint16(36, 0, true)      // internal attrs
    cv.setUint32(38, 0, true)      // external attrs
    cv.setUint32(42, offset, true) // local header offset
    central.set(nameBytes, 46)
    centrals.push(central)

    offset += local.length + payload.length
  }

  const cdSize = centrals.reduce((sum, c) => sum + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)

  const total = [...locals, ...centrals, eocd]
  const out = new Uint8Array(total.reduce((sum, part) => sum + part.length, 0))
  let cursor = 0
  for (const part of total) {
    out.set(part, cursor)
    cursor += part.length
  }
  return out
}
