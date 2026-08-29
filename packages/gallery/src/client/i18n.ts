/**
 * i18n — 面板 UI 文案（中/英双语）。
 *
 * 语言解析：settings.uiLang 显式设置优先（zh / en）；缺省 'auto' 跟随
 * 浏览器语言（navigator.language 以 zh 开头→中文，其余→英文）。
 * v0.9 起主画廊 / 设置面板 / 审阅与确认弹窗全部经 t() 取词。
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
  // 搜索 / 计数
  searchPlaceholder: ['搜索皮肤...', 'Search skins...'],
  countOf: ['共', 'total'], activeSkin: ['已启用', 'active'],
  // 上传
  uploadLabel: ['上传皮肤', 'Upload skin'], uploadHint: ['点击或拖入 .zip 皮肤包', 'Click or drop a .zip skin package'],
  parsing: ['正在解析皮肤包...', 'Parsing skin package...'], validating: ['校验中...', 'Validating...'],
  uploadFailed: ['上传失败', 'Upload failed'], installFailed: ['安装失败', 'Install failed'],
  zipOnly: ['请上传 .zip 格式的皮肤包', 'Please upload a .zip skin package'],
  validateFailed: ['校验失败', 'Validation failed'], hasWarnings: ['有警告', 'warnings'],
  installed: ['已安装（刷新后保留），点击卡片试用', 'installed (persists after refresh) — click the card to try it'],
  // 设置入口
  settingsTitle: ['设置', 'Settings'], settingsOpen: ['皮肤中心设置', 'Skin Studio settings'],
  // 设置分组
  groupAppearance: ['外观', 'Appearance'], groupMotion: ['动效', 'Motion'],
  groupMascot: ['吉祥物', 'Mascot'], groupAlerts: ['提醒', 'Alerts'], groupAdvanced: ['高级', 'Advanced'],
  // 设置项（沿用语义命名）
  mascotToggle: ['吉祥物浮层', 'Mascot overlay'],
  quoteLang: ['语录语言', 'Quote language'],
  animationPolicy: ['动画', 'Animation'],
  taskNotify: ['任务提醒', 'Task alert'],
  bgShow: ['背景透出', 'BG see-through'],
  cursorToggle: ['光标', 'Cursor'],
  tierSync: ['等级同步', 'Effort sync'],
  uiLanguage: ['界面语言', 'UI language'],
  factoryReset: ['还原出厂', 'Factory reset'],
  // 设置项说明
  mascotHint: ['应用皮肤后，在主界面右下角显示吉祥物浮层', 'Show the mascot overlay in the main view after applying a skin'],
  quoteLangHint: ['吉祥物语录语言（每款皮肤每种语言各 200 句）', 'Mascot quote language (200 per skin per language)'],
  animationHint: ['跟随系统「减少动态效果」（默认，无障碍友好）；始终播放会忽略系统设置', 'Follow the system reduce-motion setting (default); Always play ignores it'],
  taskNotifyHint: ['任务完成后：提示音（音色随皮肤系列）与/或吉祥物庆祝动作', 'On task completion: chime (per-skin timbre) and/or mascot celebration'],
  bgShowHint: ['背景图铺满窗口，界面面板半透明透出背景（无磨砂模糊）', 'Skin background fills the window; panels turn translucent (no blur)'],
  cursorHint: ['三态自定义光标（默认/悬停/点击）；点击不准可关闭回退系统光标', 'Three-state custom cursor; turn off to fall back to the system cursor'],
  tierSyncHint: ['拖动境界滑条真实修改当前会话的推理等级（改变 token 消耗）', 'Dragging the tier slider changes the real reasoning effort (affects token usage)'],
  uiLangHint: ['界面语言：自动跟随浏览器 / 强制中文 / English', 'UI language: follow the browser / force Chinese / English'],
  factoryResetHint: ['清除皮肤偏好与全部皮肤中心设置，回到 DSH 原生外观', 'Clear skin preference and all Skin Studio settings, back to native DSH'],
  // 境界
  tierLabel: ['境界', 'Tier'],
  tierFollow: ['跟随推理', 'Follow effort'], tierManual: ['手动', 'Manual'],
  tierSliderAria: ['境界档位，当前第', 'Power tier, currently'], tierOf: ['档', 'of'],
  tierSliderHint: ['境界档位：推理等级越高，角色修为/皮肤等级越高（造型、光标、背景随之变化）', 'Higher reasoning effort = higher cultivation/skin tier (look, cursor, background change)'],
  // 自定义背景
  uploadBg: ['上传背景', 'Upload BG'], resetBg: ['恢复原图', 'Reset BG'],
  bgFitCover: ['裁剪填满', 'Crop fill'], bgFitContain: ['完整显示', 'Full fit'],
  bgFitHint: ['自定义背景显示模式：裁剪填满（16:9 最佳）/ 完整显示（竖图不裁留边）', 'Custom BG fit: crop-fill (best 16:9) / full-fit (no crop)'],
  uploadBgHint: ['上传自定义背景：替换当前皮肤该档背景图（仅本机，可反复覆盖）', 'Replace this tier\'s background (local only, re-uploadable)'],
  resetBgHint: ['删除该档自定义背景，恢复生图原图', 'Remove this tier\'s custom background'],
  pickSkinFirst: ['请先选择一款皮肤', 'Pick a skin first'],
  // 状态
  enabled: ['已启用', 'Active'], on: ['开', 'On'], off: ['关', 'Off'],
  both: ['声音+动作', 'Sound+Motion'], sound: ['声音', 'Sound'], motion: ['动作', 'Motion'],
  followSystem: ['跟随系统', 'Follow system'], alwaysPlay: ['始终播放', 'Always play'],
  chinese: ['中文', '中文'], english: ['English', 'English'], auto: ['自动', 'Auto'],
  // 试穿
  tryOnStart: ['正在试穿', 'Trying on'], applied: ['已应用并保存', 'Applied & saved'],
  applyFailed: ['应用失败', 'Apply failed'], tryOnFailed: ['试穿失败', 'Try-on failed'],
  exitedTryOn: ['已退出试穿', 'Exited try-on'], resetDone: ['已还原出厂设置 — 界面回到 DSH 原生外观', 'Factory reset done — back to native DSH'],
  bgUpdated: ['档自定义背景已更新', 'tier custom BG updated'], bgReset: ['档已恢复原图', 'tier restored to original'],
  bgResetFailed: ['恢复失败', 'Reset failed'],
  tryOnBar: ['正在试穿', 'Previewing'], tempNote: ['临时预览，刷新自动还原', 'Temporary — reverts on refresh'],
  applySave: ['应用并保存', 'Apply & save'], exitRevert: ['退出还原', 'Exit & revert'],
  // 删除
  removed: ['已删除', 'removed'], removeFailed: ['删除失败', 'Remove failed'],
  // 确认对话
  cancel: ['取消', 'Cancel'], confirm: ['确认', 'Confirm'],
  confirmDeleteTitle: ['删除皮肤', 'Delete skin'],
  confirmDeleteMsg: ['将从已安装列表移除该皮肤并释放其资源（可重新上传安装）。', 'This removes the skin from installed and frees its resources (you can re-upload later).'],
  confirmResetTitle: ['还原出厂设置？', 'Factory reset?'],
  confirmResetMsg: ['将清除皮肤偏好与全部皮肤中心设置，界面回到 DSH 原生外观。皮肤中心本身保留。', 'Clears the skin preference and all Skin Studio settings, returning to native DSH. The studio itself stays.'],
  // 导出 / 审阅
  exported: ['已导出为 .zip', 'exported as .zip'], exportFailed: ['导出失败', 'Export failed'],
  nothingToExport: ['没有可导出的安装数据（旧版本安装的皮肤请重新上传一次）', 'No install data to export (re-upload skins installed by older versions)'],
  exportZip: ['导出 .zip', 'Export .zip'],
  // 空态
  emptyUploaded: ['还没有上传过皮肤 — 把皮肤包（.zip）拖到上面的上传格试试。', 'No uploaded skins yet — drop a skin package (.zip) onto the upload tile above.'],
  emptyMine: ['「我的」收录通过 npm 安装的皮肤，目前为空。', '"Mine" lists npm-installed skins; currently empty.'],
  listLoadFailed: ['皮肤列表加载失败', 'Failed to load skin list'],
  // 诊断
  diagnosticsCopy: ['复制诊断信息', 'Copy diagnostics'],
  diagnosticsHint: ['复制宿主/插件/皮肤/设置的技术快照，报 Issue 时粘贴（不含对话内容）', 'Copies a technical snapshot (host/plugin/skin/settings) for bug reports — no conversation content'],
  diagnosticsCopied: ['诊断信息已复制到剪贴板', 'Diagnostics copied to clipboard'],
  // 使用统计（纯本地）
  usageStats: ['使用统计', 'Usage stats'],
  usageStatsHint: ['仅存本机的皮肤使用时长与试穿转化统计，可随时清除', 'Local-only skin usage duration and try-on conversion; clear anytime'],
  statsSince: ['统计自', 'Since'],
  statsLocalOnly: ['仅存本机，不上传', 'local only, never uploaded'],
  statsOverview: ['总览', 'Overview'],
  tryOns: ['试穿次数', 'Try-ons'],
  applies: ['转正应用', 'Applied'],
  conversion: ['转化率', 'conversion'],
  statsPerSkin: ['皮肤排行（时长 · 激活）', 'Per skin (duration · activations)'],
  statsNoData: ['还没有数据 — 使用一段时间后再来看。', 'No data yet — check back after some use.'],
  switchesShort: ['激活', 'act.'],
  clearStats: ['清除统计', 'Clear stats'],
  clearStatsMsg: ['将删除本机的全部使用统计（时长/激活/试穿转化），不可恢复。', 'This permanently deletes all local usage stats (duration / activations / try-on conversion).'],
  statsCleared: ['使用统计已清除', 'Usage stats cleared'],
  // 皮肤工坊（无代码编辑器）
  composerTitle: ['皮肤工坊', 'Skin Composer'],
  composerHint: ['不写代码生成标准皮肤包：选配色 → 传图 → 实时预览 → 安装或导出', 'Compose a standard skin without code: colors → images → live preview → install or export'],
  composerOpen: ['创作皮肤', 'Compose skin'],
  composerBasics: ['基础', 'Basics'],
  composerName: ['皮肤名称', 'Name'],
  composerNameRequired: ['请先填写皮肤名称', 'Skin name is required'],
  composerId: ['皮肤 id（kebab-case）', 'Skin id (kebab-case)'],
  composerIdInvalid: ['皮肤 id 不合法（小写字母数字连字符，3-64 位）', 'Invalid skin id (lowercase letters, digits, hyphens; 3-64 chars)'],
  composerScheme: ['色系', 'Scheme'],
  composerDark: ['暗色', 'Dark'],
  composerLight: ['亮色', 'Light'],
  composerPrimary: ['品牌色', 'Primary'],
  composerRederive: ['重新推导配色', 'Re-derive colors'],
  composerImages: ['图片（可选）', 'Images (optional)'],
  composerAutoPreview: ['未上传预览图时自动生成品牌色渐变占位。', 'A gradient placeholder preview is generated when none is uploaded.'],
  composerPreview: ['实时预览与对比度', 'Live preview & contrast'],
  composerBubbleMe: ['帮我总结这段代码', 'Summarize this code'],
  composerBubbleAgent: ['好的，这个函数的作用是……', 'Sure — this function does…'],
  composerContrast: ['WCAG 对比度', 'WCAG contrast'],
  contrastOk: ['勉强（仅大字）', 'marginal'],
  contrastPoor: ['不可读风险', 'unreadable'],
  contrastBlock: ['存在不可读配色，请调整后再安装。', 'Unreadable color pair detected — adjust before installing.'],
  composerInstall: ['安装到本机', 'Install locally'],
  diagnosticsFailed: ['剪贴板不可用，诊断信息如下：', 'Clipboard unavailable — diagnostics below:'],
}

export function t(key: string): string {
  const pair = STRINGS[key]
  if (pair === undefined) return key
  return uiLang() === 'zh' ? pair[0] : pair[1]
}
