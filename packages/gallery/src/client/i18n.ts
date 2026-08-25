/**
 * i18n — 面板 UI 文案（中/英双语）。
 *
 * 检测浏览器语言（navigator.language 以 zh 开头→中文，其余→英文）。
 * 用户可在设置中显式切换（settings.uiLang）。
 */
import { skinStudioSettings } from './settings.ts'

export type UILang = 'zh' | 'en'

export function uiLang(): UILang {
  const explicit = skinStudioSettings.get().uiLang
  if (explicit !== undefined) return explicit
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('zh')) return 'zh'
  return 'en'
}

const STRINGS: Record<string, [string, string]> = {
  // 面板标题
  panelTitle: ['选一张皮肤，让 agent 也有自己的脸', 'Pick a skin — give your agent its own face'],
  // tab
  tabBuiltin: ['内置', 'Built-in'], tabMine: ['我的', 'Mine'], tabUploaded: ['已上传', 'Uploaded'],
  // 搜索
  searchPlaceholder: ['搜索皮肤...', 'Search skins...'],
  // 上传
  uploadLabel: ['上传皮肤', 'Upload skin'], uploadHint: ['点击或拖入 .zip 皮肤包', 'Click or drop a .zip skin package'],
  // 设置按钮
  mascotToggle: ['吉祥物浮层', 'Mascot overlay'],
  quoteLang: ['语录语言', 'Quote language'],
  animationPolicy: ['动画', 'Animation'],
  taskNotify: ['任务提醒', 'Task alert'],
  bgShow: ['背景透出', 'BG see-through'],
  cursorToggle: ['光标', 'Cursor'],
  tierSync: ['等级同步', 'Effort sync'],
  factoryReset: ['还原出厂', 'Factory reset'],
  // 境界
  tierLabel: ['境界', 'Tier'],
  tierFollow: ['跟随推理', 'Follow effort'], tierManual: ['手动', 'Manual'],
  // 自定义背景
  uploadBg: ['上传背景', 'Upload BG'], resetBg: ['恢复原图', 'Reset BG'],
  bgFitCover: ['裁剪填满', 'Crop fill'], bgFitContain: ['完整显示', 'Full fit'],
  // 状态
  enabled: ['已启用', 'Active'], on: ['开', 'On'], off: ['关', 'Off'],
  both: ['声音+动作', 'Sound+Motion'], sound: ['声音', 'Sound'], motion: ['动作', 'Motion'],
  followSystem: ['跟随系统', 'Follow system'], alwaysPlay: ['始终播放', 'Always play'],
  chinese: ['中文', '中文'], english: ['English', 'English'],
  // toast
  tryOnStart: ['正在试穿', 'Trying on'], applied: ['已应用并保存', 'Applied & saved'],
  exitedTryOn: ['已退出试穿', 'Exited try-on'], resetDone: ['已还原出厂设置', 'Factory reset done'],
  bgUpdated: ['档自定义背景已更新', 'tier custom BG updated'], bgReset: ['档已恢复原图', 'tier restored to original'],
  tryOnBar: ['正在试穿', 'Previewing'], tempNote: ['临时预览，刷新自动还原', 'Temporary — reverts on refresh'],
  applySave: ['应用并保存', 'Apply & save'], exitRevert: ['退出还原', 'Exit & revert'],
}

export function t(key: string): string {
  const pair = STRINGS[key]
  if (pair === undefined) return key
  return uiLang() === 'zh' ? pair[0] : pair[1]
}
