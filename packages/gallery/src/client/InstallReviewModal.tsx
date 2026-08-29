/**
 * InstallReviewModal — 安装前能力审阅（v0.8 上传中心可信化）。
 *
 * 从「上传 zip 即装」改为「解析 → 审阅 → 确认安装」：明确展示皮肤包将
 * 覆盖哪些 token、使用哪些图片（含像素与体积）、包大小、作者与许可证、
 * 校验警告，以及本地性承诺（图片不上传服务器、卸载即全删）。
 */
import { Modal } from './Modal.tsx'
import type { SkinEntry, ValidationResult } from './registry/types.ts'
import styles from './SkinDetailModal.module.css'

export interface InstallReviewModalProps {
  entry: SkinEntry
  validation: ValidationResult
  /** 更新安装：已安装版本的差异信息（版本号 + 本版 changelog）。 */
  updateOf?: { fromVersion: string }
  onConfirm: () => void
  onCancel: () => void
}

const kb = (n: number): string => `${Math.max(1, Math.round(n / 1024))} KB`
const mb = (n: number): string => `${(n / 1048576).toFixed(1)} MB`

export function InstallReviewModal({ entry, validation, updateOf, onConfirm, onCancel }: InstallReviewModalProps): JSX.Element {
  const stats = entry.packageStats
  const authorName = typeof entry.author === 'string' ? entry.author : entry.author.name
  const shownImages = stats?.images.slice(0, 6) ?? []
  const hiddenImages = (stats?.images.length ?? 0) - shownImages.length
  const shownTokens = entry.tokens.slice(0, 8)

  return (
    <Modal onClose={onCancel} size="default" labelledBy="install-review-title">
      <div className={styles.detail}>

        <div className={styles.meta}>
          <h2 id="install-review-title">
            {updateOf !== undefined ? '更新皮肤' : '安装审阅'} · {entry.name}
          </h2>
          <p className={styles.author}>
            {updateOf !== undefined && <>v{updateOf.fromVersion} → </>}v{entry.version} · 作者 {authorName} · 许可证 {entry.license ?? '未声明'} · {entry.colorScheme}
          </p>
        </div>

        {updateOf !== undefined && (
          <section className={styles.tokens}>
            <h3>更新内容</h3>
            {entry.changelog?.length ? (
              <ul>
                {entry.changelog.slice(0, 6).map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            ) : (
              <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
                作者未提供本版更新说明；旧版 v{updateOf.fromVersion} 会保留，安装后可一键回滚。
              </p>
            )}
          </section>
        )}

        {entry.deprecated === true && (
          <section className={styles.tokens}>
            <h3 style={{ color: '#dc2626' }}>⚠ 此皮肤已被作者标记为弃用</h3>
          </section>
        )}

        <section className={styles.tokens}>
          <h3>它将获得的能力</h3>
          <ul>
            <li>覆盖 <strong>{entry.tokenCount}</strong> 个界面配色 token（背景 / 文字 / 品牌色 / 边框等）</li>
            <li>使用 <strong>{stats?.files ?? 0}</strong> 张图片（共 {mb(stats?.bytes ?? 0)}），安装后本地浏览器渲染</li>
            <li>图片与配色<strong>只在本地使用，不上传任何服务器</strong>；卸载后完全移除</li>
            <li>不执行任何代码、不读取会话内容（纯静态资源包）</li>
          </ul>
        </section>

        {stats !== undefined && shownImages.length > 0 && (
          <section className={styles.tokens}>
            <h3>图片清单</h3>
            <div className={styles['tokens-list']}>
              {shownImages.map(img => (
                <div key={img.path} className={styles['token-row']}>
                  <code className={styles['token-name']}>{img.path}</code>
                  <code className={styles['token-value']}>
                    {img.width !== undefined ? `${img.width}×${img.height}` : '矢量/未知'} · {kb(img.bytes)}
                  </code>
                </div>
              ))}
              {hiddenImages > 0 && (
                <div className={styles['tokens-more']}>还有 {hiddenImages} 个文件...</div>
              )}
            </div>
          </section>
        )}

        <section className={styles.tokens}>
          <h3>覆盖的 token（前 {shownTokens.length} / {entry.tokenCount}）</h3>
          <div className={styles['tokens-list']}>
            {shownTokens.map(([name, value]) => (
              <div key={name} className={styles['token-row']}>
                <code className={styles['token-name']}>{name}</code>
                <code className={styles['token-value']}>{value}</code>
                <span className={styles['token-color']} style={{ background: value }} />
              </div>
            ))}
          </div>
        </section>

        {validation.warnings.length > 0 && (
          <section className={styles.tokens}>
            <h3>校验警告（{validation.warnings.length}）</h3>
            <ul>
              {validation.warnings.slice(0, 5).map(w => <li key={w}>{w}</li>)}
              {validation.warnings.length > 5 && <li>… 共 {validation.warnings.length} 条</li>}
            </ul>
          </section>
        )}

        <footer className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={onCancel}>取消</button>
          <button type="button" className={`${styles.btn} ${styles['btn--primary']}`} onClick={onConfirm}>
            确认安装
          </button>
        </footer>
      </div>
    </Modal>
  )
}
