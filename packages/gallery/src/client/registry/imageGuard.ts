/**
 * 图片尺寸守卫 — 直接解析图片文件头取像素尺寸（不解码整图，浏览器 /
 * Node 通用），在上传安装前拒绝超大像素图（避免渲染时拖垮浏览器内存）。
 *
 * 支持 PNG（IHDR）/ JPEG（SOF0/1/2/C…段）/ GIF（逻辑屏幕描述符）；
 * WebP 等其它格式返回 null（不设卡，交给体积上限兜底）。
 */

/** 尺寸上限：任一边超过该值即拒绝（8K 屏全屏背景的合理上界）。 */
export const MAX_IMAGE_DIMENSION = 8192

/** 解析结果：null = 无法识别（跳过尺寸检查）。 */
export function imageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  // PNG：8 字节签名 + IHDR（宽高各 4 字节大端）
  if (bytes.length >= 24
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  // GIF：GIF8 + 2 字节宽 + 2 字节高（小端）
  if (bytes.length >= 10
    && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) }
  }
  // JPEG：逐段扫到第一个 SOFn（0xFFC0-0xFFCF 除 C4/C8/CC），高 2 字节 + 宽 2 字节大端
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2
    while (i + 8 < bytes.length) {
      if (bytes[i] !== 0xff) { i += 1; continue }
      const marker = bytes[i + 1] ?? 0
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const b2 = bytes[i + 2] ?? 0
      const b3 = bytes[i + 3] ?? 0
      const segLength = (b2 << 8) | b3
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const height = ((bytes[i + 5] ?? 0) << 8) | (bytes[i + 6] ?? 0)
        const width = ((bytes[i + 7] ?? 0) << 8) | (bytes[i + 8] ?? 0)
        return { width, height }
      }
      i += 2 + segLength
    }
    return null
  }
  return null
}

/**
 * 检查一组图片的像素尺寸，超限抛错（带文件名，可读错误直达上传 toast）。
 * 只检查位图（PNG/JPEG/GIF）；SVG 是矢量天然无像素上限，交给体积限制。
 */
export function assertImageBounds(images: Iterable<[path: string, bytes: Uint8Array]>): void {
  for (const [path, bytes] of images) {
    if (path.endsWith('.svg')) continue
    const dims = imageDimensions(bytes)
    if (dims === null) continue
    if (Math.max(dims.width, dims.height) > MAX_IMAGE_DIMENSION) {
      throw new Error(`图片 ${path} 像素 ${dims.width}×${dims.height} 超过 ${MAX_IMAGE_DIMENSION}px 上限（过大图片会拖垮浏览器）`)
    }
  }
}
