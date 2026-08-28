/**
 * SVG 图标（验收：无 emoji，图标全部 SVG）。
 * 全部 16×16 / 20×20 描边风格，stroke 跟随 currentColor。
 */
import type { ReactNode } from 'react'
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ children, size = 16, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** 侧边栏入口：调色盘。 */
export function PaletteIcon({ size = 20, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M8 1.5a6.5 6.5 0 0 0 0 13c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.75-.4-1-.25-.3-.4-.65-.4-1 0-.85.7-1.5 1.55-1.5H12a2.5 2.5 0 0 0 2.5-2.5C14.5 3.9 11.6 1.5 8 1.5Z" />
      <circle cx="5" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="4.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11" cy="5.4" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** 搜索框。 */
export function SearchIcon({ size, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </Svg>
  )
}

/** 上传。 */
export function UploadIcon({ size, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M8 10.5V2.5" />
      <path d="M4.8 5.4 8 2.2l3.2 3.2" />
      <path d="M2.5 10.5v2a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </Svg>
  )
}

/** 关闭。 */
export function CloseIcon({ size, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M3.5 3.5 12.5 12.5" />
      <path d="M12.5 3.5 3.5 12.5" />
    </Svg>
  )
}

/** 外链箭头（替代「来源 ↗」里的字符箭头）。 */
export function ExternalLinkIcon({ size, ...rest }: IconProps) {
  return (
    <Svg size={size} {...rest}>
      <path d="M9 2.5h4.5V7" />
      <path d="M13.5 2.5 7.5 8.5" />
      <path d="M12.5 9.5v3a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5V5.5A1.5 1.5 0 0 1 4 4h3" />
    </Svg>
  )
}

/** Token 列表展开/收起箭头（替代 ▾ ▴）。 */
export function ChevronIcon({ expanded = false, size: _size, ...rest }: IconProps & { expanded?: boolean }) {
  return (
    <Svg
      style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
      {...rest}
    >
      <path d="M4 6.2 8 10.2 12 6.2" />
    </Svg>
  )
}

/** 颜色圆点（卡片配色摘要 + 详情 hero 徽章）。 */
export function ColorDot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: '0 0 0 1px var(--dsw-alias-border-l1) inset',
      }}
    />
  )
}
